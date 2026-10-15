from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
from flask import Flask, jsonify, request


MODEL_PATH = Path(__file__).resolve().with_name("model.pkl")
FEATURE_COLUMNS = ["saturation", "edge", "grey", "zone"]

app = Flask(__name__)


@lru_cache(maxsize=1)
def load_bundle():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
    bundle = joblib.load(MODEL_PATH)
    return bundle


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET"
    return response


@app.get("/health")
def health():
    bundle = load_bundle()
    return jsonify(
        {
            "status": "ok",
            "model_path": str(MODEL_PATH),
            "feature_columns": bundle.get("feature_columns", FEATURE_COLUMNS),
            "mae": bundle.get("mae"),
        }
    )


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Expected JSON body."}), 400

    features = payload.get("features") if isinstance(payload, dict) else payload
    if not isinstance(features, list) or len(features) != 4:
        return jsonify({"error": "Expected features array with 4 numeric values."}), 400

    try:
        vector = np.array(features, dtype=float).reshape(1, -1)
    except ValueError:
        return jsonify({"error": "Features must be numeric."}), 400

    bundle = load_bundle()
    model = bundle["model"]
    health_value = float(model.predict(vector)[0])
    health_value = max(0.0, min(100.0, health_value))

    return jsonify(
        {
            "health": health_value,
            "feature_columns": bundle.get("feature_columns", FEATURE_COLUMNS),
            "mae": bundle.get("mae"),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
