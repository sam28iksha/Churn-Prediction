from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        proba = model.predict_proba(df)
        return {"churn": int(prediction[0]), "confidence": float(proba[0][1])}
    except Exception as e:
        return {"error": str(e)}