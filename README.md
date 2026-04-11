# SaaS Churn Prediction

End-to-end churn prediction starter for a public SaaS-style dataset.

Dataset: [SaaS Customer Churn Prediction Dataset](https://www.kaggle.com/datasets/suhanigupta04/saas-customer-churn-prediction-dataset), a CC0 public-domain synthetic dataset with 2,500 customer records split into `train.csv` and `test.csv`. It includes SaaS usage features, latest support-ticket text, and a binary `Churn` target.

## Project layout

```text
.
├── data/
│   ├── raw/          # Put Kaggle train.csv and test.csv here
│   └── processed/    # Model outputs and predictions
├── models/           # Trained sklearn pipelines
├── reports/          # Metrics JSON
├── src/
│   ├── make_sample_data.py
│   └── train.py
└── requirements.txt
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Get the public dataset

If you have the Kaggle CLI configured:

```bash
kaggle datasets download suhanigupta04/saas-customer-churn-prediction-dataset -p data/raw --unzip
```

The pipeline expects:

```text
data/raw/train.csv
data/raw/test.csv
```

## Run the model

```bash
python -m src.train
```

If the Kaggle CSVs are not present yet, the script automatically creates a small local sample dataset with the same schema so you can validate the workflow immediately.

Outputs:

```text
models/churn_pipeline.joblib
reports/metrics.json
data/processed/test_predictions.csv
```

## What the model does

The training pipeline combines:

- numeric usage features: `Account_Age_Days`, `Daily_Usage_Mins`
- categorical behavior: `Login_Frequency`
- support-ticket text: `Last_Support_Ticket` through TF-IDF
- target: `Churn`

It trains a class-balanced logistic regression classifier and reports accuracy, ROC AUC, average precision, and a classification report.
