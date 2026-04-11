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
        expected_cols = model.feature_names_in_

        for col in expected_cols:
            if col not in df:
                df[col] = "unknown"

        df = df.astype(str)
        df = df[expected_cols]

        prediction = model.predict(df)
        return {"churn": int(prediction[0])}

    except Exception as e:
        return {"error": str(e)}