from argparse import ArgumentParser
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split


FEATURE_COLUMNS = ["saturation", "edge", "grey", "zone"]
TARGET_COLUMN = "health"


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("--csv", default="dataset/blutrack_dataset.csv")
    parser.add_argument("--model-out", default="ml/model.pkl")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--n-estimators", type=int, default=300)
    parser.add_argument("--min-samples-leaf", type=int, default=1)
    return parser.parse_args()


def main():
    args = parse_args()
    data = pd.read_csv(args.csv)
    data = data.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])

    X = data[FEATURE_COLUMNS]
    y = data[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
    )

    model = RandomForestRegressor(
        n_estimators=args.n_estimators,
        min_samples_leaf=args.min_samples_leaf,
        random_state=args.random_state,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)

    model_path = Path(args.model_out)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "feature_columns": FEATURE_COLUMNS,
            "mae": float(mae),
        },
        model_path,
    )

    print(f"rows={len(data)}")
    print(f"mae={mae:.4f}")
    print(f"saved_model={model_path.resolve()}")


if __name__ == "__main__":
    main()
