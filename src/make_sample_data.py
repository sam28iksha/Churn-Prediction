from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


POSITIVE_TICKETS = [
    "The product is working well and our team is happy.",
    "Can you help us learn the reporting feature better?",
    "We like the workflow but need guidance on admin setup.",
    "Everything is stable, just asking about an integration.",
]

NEGATIVE_TICKETS = [
    "The app is slow and we are frustrated with repeated bugs.",
    "We cannot get value from the dashboard and may cancel.",
    "Support has not resolved our blocker and usage is dropping.",
    "The team is unhappy with login issues and missing features.",
]


def _build_frame(n_rows: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    account_age = rng.integers(15, 1100, size=n_rows)
    usage = rng.normal(52, 24, size=n_rows).clip(2, 180).round(1)
    login_frequency = rng.choice(
        ["Daily", "Weekly", "Rarely"],
        size=n_rows,
        p=[0.45, 0.35, 0.20],
    )

    risk_score = (
        (login_frequency == "Rarely").astype(float) * 1.8
        + (login_frequency == "Weekly").astype(float) * 0.5
        + (usage < 25).astype(float) * 1.4
        + (account_age < 90).astype(float) * 0.8
        + rng.normal(0, 0.6, size=n_rows)
    )
    churn_probability = 1 / (1 + np.exp(-(risk_score - 1.8)))
    churn = rng.binomial(1, churn_probability)

    tickets = [
        rng.choice(NEGATIVE_TICKETS if label else POSITIVE_TICKETS)
        for label in churn
    ]

    return pd.DataFrame(
        {
            "Customer_ID": [f"CUST-{seed}-{i:04d}" for i in range(n_rows)],
            "Name": [f"Customer {i:04d}" for i in range(n_rows)],
            "Email": [f"customer{i:04d}@example.com" for i in range(n_rows)],
            "Account_Age_Days": account_age,
            "Login_Frequency": login_frequency,
            "Daily_Usage_Mins": usage,
            "Last_Support_Ticket": tickets,
            "Churn": churn,
        }
    )


def create_sample_data(raw_dir: Path, train_rows: int = 500, test_rows: int = 150) -> None:
    raw_dir.mkdir(parents=True, exist_ok=True)
    _build_frame(train_rows, seed=42).to_csv(raw_dir / "train.csv", index=False)
    _build_frame(test_rows, seed=43).to_csv(raw_dir / "test.csv", index=False)


if __name__ == "__main__":
    create_sample_data(Path("data/raw"))
    print("Created sample data in data/raw/train.csv and data/raw/test.csv")
