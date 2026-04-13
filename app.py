from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

app = FastAPI()

# CORS (important for React)
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

        # Expected columns
        expected_cols = model.feature_names_in_

        # Add missing columns
        for col in expected_cols:
            if col not in df:
                df[col] = "unknown"

        # Numeric columns
        numeric_cols = ["tenure", "MonthlyCharges", "TotalCharges"]
        for col in numeric_cols:
            if col in df:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Convert others to string
        for col in df.columns:
            if col not in numeric_cols:
                df[col] = df[col].astype(str)

        # Reorder columns
        df = df[expected_cols]

        # Prediction
        proba = model.predict_proba(df)[0][1]

        # Explanation logic
        reasons = []

        if df["tenure"].iloc[0] < 12:
            reasons.append("Customer is new (low tenure)")

        if df["MonthlyCharges"].iloc[0] > 80:
            reasons.append("High monthly charges")

        if df["Contract"].iloc[0] == "Month-to-month":
            reasons.append("No long-term contract")

        if df["InternetService"].iloc[0] == "Fiber optic":
            reasons.append("High-cost internet plan")

        if df["PaymentMethod"].iloc[0] == "Electronic check":
            reasons.append("Less stable payment method")

        if not reasons:
            reasons.append("Customer shows stable usage patterns")

        return {
            "churn": int(proba > 0.5),
            "confidence": float(proba),
            "reasons": reasons
        }

    except Exception as e:
        return {"error": str(e)}