# ChurnSense AI — SaaS Customer Churn Prediction Platform

An end-to-end machine learning web application that predicts customer churn risk for SaaS businesses using behavioral, billing, and support-ticket data.

This project combines:
- Machine Learning
- FastAPI backend engineering
- React frontend development
- REST API integration
- Cloud deployment using Render and Vercel

The platform supports:
1. Real-time churn prediction
2. Uploading custom CSV datasets
3. Dynamic model training and prediction

---

# Live Demo

## Frontend
https://churn-prediction-two.vercel.app

## Backend API Docs
https://churn-prediction-1-cgd6.onrender.com/docs

---

# Features

- Real-time customer churn prediction
- Interactive React frontend
- FastAPI REST backend
- Upload custom CSV datasets
- Dynamically train ML models on uploaded data
- Prediction confidence scores
- REST API integration
- Live deployment using Render and Vercel
- Swagger API documentation

---

# Tech Stack

## Frontend
- React.js
- JavaScript
- Tailwind CSS
- Framer Motion
- Lucide React

## Backend
- Python
- FastAPI
- scikit-learn
- pandas
- NumPy
- joblib

## Deployment & Tools
- Render
- Vercel
- Git
- GitHub

---

# Dataset

Dataset used:

SaaS Customer Churn Prediction Dataset  
https://www.kaggle.com/datasets/suhanigupta04/saas-customer-churn-prediction-dataset

The dataset contains:
- SaaS customer usage metrics
- Login behavior
- Billing information
- Support ticket text
- Binary churn labels

---

# Project Structure

```text
.
├── data/
│   ├── raw/
│   └── processed/
├── frontend/
├── models/
├── reports/
├── src/
│   ├── make_sample_data.py
│   └── train.py
├── app.py
├── requirements.txt
└── README.md
```

---

# Machine Learning Pipeline

The churn prediction pipeline combines:

## Numeric Features
- Account age
- Daily usage
- Monthly charges

## Categorical Features
- Login frequency
- Contract type
- Payment method

## Text Features
- Support ticket text using TF-IDF vectorization

## Model Used
- Logistic Regression (class-balanced)

## Preprocessing
- StandardScaler
- OneHotEncoder
- ColumnTransformer
- scikit-learn Pipelines

---

# Model Performance

Achieved on telecom churn prediction workflow:

- Accuracy: 75%
- ROC-AUC: 0.84
- Average Precision: 0.65

Generated outputs:
- Trained sklearn pipeline
- Metrics JSON report
- Prediction CSV outputs

---

# Running Locally

## Clone Repository

```bash
git clone https://github.com/sam28iksha/Churn-Prediction.git
cd Churn-Prediction
```

## Backend Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run backend:

```bash
python -m uvicorn app:app --reload --port 8001
```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

# API Endpoints

## Predict Churn

```http
POST /predict
```

## Upload CSV Dataset

```http
POST /upload-csv
```

## Train Custom Model

```http
POST /train
```

---

# Challenges Faced During Development

This project involved solving several real-world engineering and deployment issues:

- Fixed CORS errors between React frontend and FastAPI backend
- Solved scikit-learn model serialization compatibility issues across environments
- Debugged Render deployment failures and runtime crashes
- Handled missing dependency issues (`python-multipart`) for CSV uploads
- Implemented dynamic CSV schema handling for uploaded datasets
- Integrated frontend and backend APIs across local and deployed environments
- Fixed model-loading and deployment path issues in production
- Resolved React frontend rendering and API communication issues

These challenges significantly improved my understanding of full-stack ML system development and deployment workflows.

---

# Future Improvements

- Add explainable AI visualizations
- Support multiple ML model choices
- Add authentication and dashboards
- Improve analytics and reporting
- Add Docker containerization
- Add cloud database integration

---

# Screenshots

Add screenshots of:
- Main dashboard
- Prediction results
- CSV upload workflow
- Swagger API docs

---

# Author

## Samiksha Khandelwal

GitHub:  
https://github.com/sam28iksha

LinkedIn:  
https://linkedin.com/in/samiksha-khandelwal-349766311

---

# Why This Project Matters

This project goes beyond a traditional ML notebook by combining:
- Machine learning
- Backend engineering
- Frontend development
- Deployment and DevOps
- API integration
- Real-world debugging

It demonstrates the process of building and deploying a complete end-to-end AI product.

