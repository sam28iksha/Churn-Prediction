from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import uuid
import tempfile
import io
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Hardcoded telecom model ──────────────────────────────────────────────────

telecom_model = None
try:
    model_path = "models/churn_pipeline.joblib"
    if os.path.exists(model_path):
        telecom_model = joblib.load(model_path)
        print("Telecom model loaded successfully")
    else:
        print("Telecom model file not found")
except Exception as e:
    print("Error loading telecom model:", e)


@app.get("/")
def home():
    return {"message": "ChurnSense API is running"}


@app.post("/predict")
def predict(data: dict):
    try:
        if telecom_model is None:
            return {"error": "Telecom model not loaded"}
        df = pd.DataFrame([data])
        prediction = telecom_model.predict(df)
        proba = telecom_model.predict_proba(df)
        return {"churn": int(prediction[0]), "confidence": float(proba[0][1])}
    except Exception as e:
        return {"error": str(e)}


# ── Session store (in-memory, temp files) ────────────────────────────────────
# Maps session_id -> { model_path, schema }
sessions = {}


# ── Upload CSV and return columns for target selection ───────────────────────

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # Drop unnamed index columns and obvious ID columns
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        id_like = [c for c in df.columns if c.lower() in ['rownumber', 'customerid', 'surname', 'id', 'customerid', 'userid', 'user_id', 'customer_id']]
        df = df.drop(columns=id_like, errors='ignore')

        session_id = str(uuid.uuid4())

        # Save CSV to temp file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
        tmp.write(contents)
        tmp.close()

        sessions[session_id] = {
            "csv_path": tmp.name,
            "model_path": None,
            "schema": None
        }

        return {
            "session_id": session_id,
            "columns": list(df.columns),
            "row_count": len(df)
        }

    except Exception as e:
        return {"error": str(e)}


# ── Train model on uploaded CSV once user picks target column ─────────────────

class TrainRequest(BaseModel):
    session_id: str
    target_column: str


@app.post("/train")
def train(req: TrainRequest):
    try:
        session = sessions.get(req.session_id)
        if not session:
            return {"error": "Session not found. Please re-upload your CSV."}

        df = pd.read_csv(session["csv_path"])
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        id_like = [c for c in df.columns if c.lower() in ['rownumber', 'customerid', 'surname', 'id', 'userid', 'user_id', 'customer_id']]
        df = df.drop(columns=id_like, errors='ignore')

        if req.target_column not in df.columns:
            return {"error": f"Column '{req.target_column}' not found in dataset."}

        # Encode target: handle Yes/No, True/False, 1/0
        y = df[req.target_column].copy()
        if y.dtype == object:
            y = y.str.strip().str.lower().map(
                lambda v: 1 if v in ['yes', 'true', '1', 'churn'] else 0
            )
        else:
            y = y.astype(int)

        X = df.drop(columns=[req.target_column])

        # Identify numeric and categorical columns
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = X.select_dtypes(include=['object']).columns.tolist()

        # Build schema for frontend form
        schema = []
        for col in numeric_cols:
            schema.append({
                "name": col,
                "type": "numeric",
                "min": float(X[col].min()),
                "max": float(X[col].max()),
                "mean": round(float(X[col].mean()), 2)
            })
        for col in categorical_cols:
            schema.append({
                "name": col,
                "type": "categorical",
                "options": sorted(X[col].dropna().unique().tolist())
            })

        # Build and train pipeline
        numeric_transformer = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])
        categorical_transformer = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore"))
        ])

        preprocessor = ColumnTransformer([
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols)
        ])

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(max_iter=1000))
        ])

        pipeline.fit(X, y)

        # Save trained model to temp file
        model_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".joblib")
        joblib.dump(pipeline, model_tmp.name)
        model_tmp.close()

        sessions[req.session_id]["model_path"] = model_tmp.name
        sessions[req.session_id]["schema"] = schema
        sessions[req.session_id]["numeric_cols"] = numeric_cols
        sessions[req.session_id]["categorical_cols"] = categorical_cols

        return {
            "message": "Model trained successfully",
            "schema": schema,
            "rows_used": len(df)
        }

    except Exception as e:
        return {"error": str(e)}


# ── Predict using user-trained model ─────────────────────────────────────────

class DynamicPredictRequest(BaseModel):
    session_id: str
    data: dict


@app.post("/predict-custom")
def predict_custom(req: DynamicPredictRequest):
    try:
        session = sessions.get(req.session_id)
        if not session or not session["model_path"]:
            return {"error": "No trained model found. Please upload and train first."}

        model = joblib.load(session["model_path"])
        schema = session["schema"]

        # Cast numeric fields properly
        row = {}
        for field in schema:
            val = req.data.get(field["name"])
            if field["type"] == "numeric":
                row[field["name"]] = float(val) if val is not None else 0.0
            else:
                row[field["name"]] = str(val) if val is not None else ""

        df = pd.DataFrame([row])
        prediction = model.predict(df)
        proba = model.predict_proba(df)

        return {
            "churn": int(prediction[0]),
            "confidence": float(proba[0][1])
        }

    except Exception as e:
        return {"error": str(e)}