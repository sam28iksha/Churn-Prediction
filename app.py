from fastapi import FastAPI
import joblib
import pandas as pd

app = FastAPI()

model = joblib.load("models/churn_pipeline.joblib")

@app.get("/")
def home():
    return {"message": "Churn Prediction API is running"}

@app.post("/predict")
def predict(data: dict):
    try:
        df = pd.DataFrame([data])

        expected_cols = model.feature_names_in_

        # Add missing columns
        for col in expected_cols:
            if col not in df:
                df[col] = "unknown"

        # Convert EVERYTHING to string first
        df = df.astype(str)

        # Reorder columns
        df = df[expected_cols]

        prediction = model.predict(df)

        return {"churn": int(prediction[0])}

    except Exception as e:
        return {"error": str(e)}