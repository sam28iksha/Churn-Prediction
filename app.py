from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

app = FastAPI()

# ✅ ADD THIS (important)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("models/churn_pipeline.joblib")

@app.get("/")
def home():
    return {"message": "Churn Prediction API is running"}

@app.post("/predict")
def predict(data: dict):
    try:
        df = pd.DataFrame([data])

        # Get expected columns from model
        expected_cols = model.feature_names_in_

        # Add missing columns
        for col in expected_cols:
            if col not in df:
                df[col] = "unknown"

        # Fix numeric columns
        numeric_cols = ["tenure", "MonthlyCharges", "TotalCharges"]
        for col in numeric_cols:
            if col in df:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Convert everything else to string
        for col in df.columns:
            if col not in numeric_cols:
                df[col] = df[col].astype(str)

        # Reorder columns
        df = df[expected_cols]

        prediction = model.predict(df)
        return {"churn": int(prediction[0])}

    except Exception as e:
        return {"error": str(e)}