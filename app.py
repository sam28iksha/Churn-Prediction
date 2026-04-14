from fastapi import FastAPI
import joblib
import pandas as pd
import os

app = FastAPI()

# ✅ SAFE LOAD MODEL (no crash)
model = None

try:
    model_path = "models/churn_pipeline.joblib"
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print("Model loaded successfully")
    else:
        print("Model file not found")
except Exception as e:
    print("Error loading model:", e)


@app.get("/")
def home():
    return {"message": "API is running"}


@app.post("/predict")
def predict(data: dict):
    try:
        if model is None:
            return {"error": "Model not loaded"}

        df = pd.DataFrame([data])
        prediction = model.predict(df)

        return {"churn": int(prediction[0])}

    except Exception as e:
        return {"error": str(e)}