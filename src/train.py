from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.make_sample_data import create_sample_data


TARGET = "Churn"

NUMERIC_FEATURES = [
    "tenure",
    "MonthlyCharges",
    "TotalCharges"
]

CATEGORICAL_FEATURES = [
    "gender",
    "SeniorCitizen",
    "Partner",
    "Dependents",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod"
]
ID_COLUMNS = ["Customer_ID", "Name", "Email"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a SaaS churn prediction model.")
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--processed-dir", type=Path, default=Path("data/processed"))
    parser.add_argument("--model-dir", type=Path, default=Path("models"))
    parser.add_argument("--report-dir", type=Path, default=Path("reports"))
    parser.add_argument("--model-name", default="churn_pipeline.joblib")
    return parser.parse_args()


def ensure_data(raw_dir: Path) -> None:
    train_path = raw_dir / "train.csv"
    test_path = raw_dir / "test.csv"
    if train_path.exists() and test_path.exists():
        return

    if train_path.exists() or test_path.exists():
        missing = test_path if train_path.exists() else train_path
        raise FileNotFoundError(
            f"Found a partial dataset. Add the missing file before training: {missing}"
        )

    print("Kaggle data not found. Creating local sample data with matching schema.")
    create_sample_data(raw_dir)


def load_data(raw_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    train_df = pd.read_csv(raw_dir / "train.csv")
    test_df = pd.read_csv(raw_dir / "test.csv")
    return train_df, test_df


def validate_columns(df: pd.DataFrame, dataset_name: str) -> None:
    required_columns = set(NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET])
    missing = sorted(required_columns - set(df.columns))
    if missing:
        raise ValueError(f"{dataset_name} is missing required columns: {missing}")


def build_pipeline() -> Pipeline:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("one_hot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, NUMERIC_FEATURES),
            ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
            
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=1000,
                    random_state=42,
                ),
            ),
        ]
    )


def evaluate(y_true: pd.Series, y_probability: pd.Series, y_pred: pd.Series) -> dict:
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "roc_auc": roc_auc_score(y_true, y_probability),
        "average_precision": average_precision_score(y_true, y_probability),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "classification_report": classification_report(y_true, y_pred, output_dict=True),
    }


def main() -> None:
    args = parse_args()
    ensure_data(args.raw_dir)

    train_df, test_df = load_data(args.raw_dir)
    validate_columns(train_df, "train.csv")
    validate_columns(test_df, "test.csv")
    train_df["TotalCharges"] = pd.to_numeric(train_df["TotalCharges"], errors="coerce")
    test_df["TotalCharges"] = pd.to_numeric(test_df["TotalCharges"], errors="coerce")

    feature_columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X_train = train_df[feature_columns].copy()
    y_train = (train_df[TARGET] == "Yes").astype(int)
    X_test = test_df[feature_columns].copy()
    y_test = (test_df[TARGET] == "Yes").astype(int)

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_probability = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_probability >= 0.5).astype(int)
    metrics = evaluate(y_test, y_probability, y_pred)

    args.processed_dir.mkdir(parents=True, exist_ok=True)
    args.model_dir.mkdir(parents=True, exist_ok=True)
    args.report_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(pipeline, args.model_dir / args.model_name)

    prediction_columns = [column for column in ID_COLUMNS if column in test_df.columns]
    predictions = test_df[prediction_columns].copy() if prediction_columns else pd.DataFrame()
    predictions["churn_probability"] = y_probability
    predictions["predicted_churn"] = y_pred
    if TARGET in test_df.columns:
        predictions["actual_churn"] = y_test
    predictions.to_csv(args.processed_dir / "test_predictions.csv", index=False)

    with (args.report_dir / "metrics.json").open("w", encoding="utf-8") as metrics_file:
        json.dump(metrics, metrics_file, indent=2)

    print("Training complete.")
    print(f"Accuracy: {metrics['accuracy']:.3f}")
    print(f"ROC AUC: {metrics['roc_auc']:.3f}")
    print(f"Average precision: {metrics['average_precision']:.3f}")
    print(f"Saved model to {args.model_dir / args.model_name}")
    print(f"Saved metrics to {args.report_dir / 'metrics.json'}")
    print(f"Saved predictions to {args.processed_dir / 'test_predictions.csv'}")


if __name__ == "__main__":
    main()
