"""
MetroFlow — Production Model Training

PRODUCTION CROWD MODEL:
    Random Forest — RF Critical

Previous best reference:
    Accuracy        : 86.64%
    Macro-F1        : 0.7827
    Critical Recall : 83.42%

The RF Critical model is ALWAYS used for production crowd prediction.

DEMAND MODEL:
    XGBoost Regressor

Features:
    24 leakage-safe engineered features

Outputs:
    services/ai/artifacts/crowd_model.joblib
    services/ai/artifacts/demand_model.joblib
    services/ai/artifacts/encoders.joblib
    services/ai/artifacts/model_metrics.json
    apps/web/src/lib/model-metrics.json
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    r2_score,
    recall_score,
)
from sklearn.preprocessing import LabelEncoder

from xgboost import XGBRegressor


# ============================================================
# PATHS
# ============================================================

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

DATA = (
    ROOT.parent
    / "MetroFlow_Dataset"
    / "metro_ai_training_data.csv"
)

ART = HERE / "artifacts"
ART.mkdir(exist_ok=True)

WEB_OUT = (
    ROOT
    / "apps"
    / "web"
    / "src"
    / "lib"
    / "model-metrics.json"
)


# ============================================================
# CONFIGURATION
# ============================================================

LEVELS = [
    "Low",
    "Medium",
    "High",
    "Critical",
]

SPLIT_DATE = "2024-12-15"

RANDOM_STATE = 42


# ============================================================
# 24 FEATURES
# ============================================================

FEATURES = [

    # Basic features
    "hour",
    "previous_hour_passengers",
    "previous_day_average",
    "holiday",
    "train_frequency",
    "occupancy",

    # Time features
    "hour_sin",
    "hour_cos",
    "morning_peak",
    "evening_peak",
    "peak_hour",

    # Passenger features
    "passenger_average_ratio",
    "passenger_volume_log",

    # Occupancy interactions
    "occupancy_train_ratio",
    "occupancy_x_frequency",
    "occupancy_x_peak",

    # Station statistics
    "station_mean_volume",
    "station_volume_std",
    "station_observation_count",

    # Encoded categorical features
    "day_of_week_e",
    "weather_e",
    "event_e",

    # Interaction features
    "event_x_peak",
    "holiday_x_peak",
]


# ============================================================
# CLASSIFICATION METRICS
# ============================================================

def classification_metrics(y_true, y_pred):

    recalls = recall_score(
        y_true,
        y_pred,
        average=None,
        labels=range(len(LEVELS)),
        zero_division=0,
    )

    return {
        "accuracy": round(
            float(
                accuracy_score(
                    y_true,
                    y_pred,
                )
            ),
            4,
        ),

        "macro_f1": round(
            float(
                f1_score(
                    y_true,
                    y_pred,
                    average="macro",
                    zero_division=0,
                )
            ),
            4,
        ),

        "macro_recall": round(
            float(
                recall_score(
                    y_true,
                    y_pred,
                    average="macro",
                    zero_division=0,
                )
            ),
            4,
        ),

        "recall_per_class": {
            level: round(
                float(recall),
                4,
            )
            for level, recall in zip(
                LEVELS,
                recalls,
            )
        },
    }


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def create_features(df):

    df = df.copy()

    # ========================================================
    # BASIC NUMERIC CONVERSIONS
    # ========================================================

    numeric_cols = [
        "hour",
        "previous_hour_passengers",
        "previous_day_average",
        "holiday",
        "train_frequency",
        "occupancy",
    ]

    for col in numeric_cols:

        df[col] = pd.to_numeric(
            df[col],
            errors="coerce",
        )

    df[numeric_cols] = (
        df[numeric_cols]
        .replace(
            [np.inf, -np.inf],
            np.nan,
        )
        .fillna(0)
    )

    # ========================================================
    # CYCLIC HOUR FEATURES
    # ========================================================

    df["hour_sin"] = np.sin(
        2 * np.pi * df["hour"] / 24
    )

    df["hour_cos"] = np.cos(
        2 * np.pi * df["hour"] / 24
    )

    # ========================================================
    # PEAK-HOUR FEATURES
    # ========================================================

    df["morning_peak"] = (
        df["hour"].between(7, 10)
    ).astype(int)

    df["evening_peak"] = (
        df["hour"].between(17, 20)
    ).astype(int)

    df["peak_hour"] = (
        (df["morning_peak"] == 1)
        |
        (df["evening_peak"] == 1)
    ).astype(int)

    # ========================================================
    # PASSENGER FEATURES
    # ========================================================

    df["passenger_average_ratio"] = (
        df["previous_hour_passengers"]
        /
        (df["previous_day_average"] + 1)
    )

    df["passenger_volume_log"] = np.log1p(
        np.maximum(
            df["previous_hour_passengers"],
            0,
        )
    )

    # ========================================================
    # OCCUPANCY / FREQUENCY FEATURES
    # ========================================================

    df["occupancy_train_ratio"] = (
        df["occupancy"]
        /
        (df["train_frequency"] + 1)
    )

    df["occupancy_x_frequency"] = (
        df["occupancy"]
        *
        df["train_frequency"]
    )

    df["occupancy_x_peak"] = (
        df["occupancy"]
        *
        df["peak_hour"]
    )

    # ========================================================
    # STATION FEATURES
    #
    # These are placeholders initially.
    # Actual leakage-safe values are calculated later
    # using ONLY internal training data.
    # ========================================================

    df["station_mean_volume"] = 0.0

    df["station_volume_std"] = 0.0

    df["station_observation_count"] = 0.0

    # ========================================================
    # CATEGORICAL CLEANING
    # ========================================================

    for col in [
        "day_of_week",
        "weather",
        "event",
    ]:

        if col not in df.columns:

            df[col] = "Unknown"

        df[col] = (
            df[col]
            .fillna("Unknown")
            .astype(str)
        )

    # ========================================================
    # TEMPORARY EVENT / HOLIDAY ENCODING
    #
    # These are created before the interaction features.
    # Final LabelEncoder mappings are created later.
    # ========================================================

    # We intentionally use categorical codes here only
    # for the interaction features.
    #
    # The final event_e/day_of_week_e/weather_e columns
    # are replaced later by leakage-safe LabelEncoders.

    event_temp = (
        pd.Categorical(
            df["event"]
        ).codes
    )

    df["event_x_peak"] = (
        event_temp
        *
        df["peak_hour"]
    )

    df["holiday_x_peak"] = (
        df["holiday"]
        *
        df["peak_hour"]
    )

    return df


# ============================================================
# STATION STATISTICS
# ============================================================

def add_station_statistics(
    part,
    station_stats,
    fallback_mean,
):

    part = part.copy()

    part = part.drop(
        columns=[
            "station_mean_volume",
            "station_volume_std",
            "station_observation_count",
        ],
        errors="ignore",
    )

    part = part.merge(
        station_stats,
        on="station_id",
        how="left",
    )

    part["station_mean_volume"] = (
        part["station_mean_volume"]
        .fillna(fallback_mean)
    )

    part["station_volume_std"] = (
        part["station_volume_std"]
        .fillna(0)
    )

    part["station_observation_count"] = (
        part["station_observation_count"]
        .fillna(0)
    )

    return part


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 78)
    print("METROFLOW — PRODUCTION RF CRITICAL TRAINING")
    print("=" * 78)

    # ========================================================
    # 1. LOAD DATA
    # ========================================================

    print("\nLoading dataset:")
    print(DATA)

    df = pd.read_csv(DATA)

    df["date"] = pd.to_datetime(
        df["date"],
        dayfirst=True,
        errors="coerce",
    )

    df["holiday"] = (
        pd.to_numeric(
            df["holiday"],
            errors="coerce",
        )
        .fillna(0)
        .astype(int)
    )

    df = df.sort_values(
        [
            "date",
            "station_id",
            "hour",
        ]
    ).reset_index(drop=True)

    print(
        f"\nTotal rows: {len(df):,}"
    )

    # ========================================================
    # 2. TARGET
    # ========================================================

    target = "future_crowd_level"

    if target not in df.columns:

        raise ValueError(
            f"Missing target column: {target}"
        )

    print("\nTarget distribution:")
    print(
        df[target].value_counts()
    )

    # ========================================================
    # 3. FEATURE ENGINEERING
    # ========================================================

    print(
        "\nCreating leakage-safe engineered features..."
    )

    df = create_features(df)

    # ========================================================
    # 4. STRICT TEMPORAL SPLIT
    # ========================================================

    train_all = df[
        df["date"] < SPLIT_DATE
    ].copy()

    test = df[
        df["date"] >= SPLIT_DATE
    ].copy()

    # 80/20 temporal validation
    validation_date = train_all[
        "date"
    ].quantile(0.80)

    train = train_all[
        train_all["date"] < validation_date
    ].copy()

    valid = train_all[
        train_all["date"] >= validation_date
    ].copy()

    print("\nTime-based split:")

    print(
        f"Internal training : {len(train):,}"
    )

    print(
        f"Validation        : {len(valid):,}"
    )

    print(
        f"Final test        : {len(test):,}"
    )

    # ========================================================
    # 5. LEAKAGE-SAFE STATION STATISTICS
    # ========================================================

    print(
        "\nCreating leakage-safe station statistics..."
    )

    station_stats = (
        train
        .groupby("station_id")[
            "previous_hour_passengers"
        ]
        .agg(
            station_mean_volume="mean",
            station_volume_std="std",
            station_observation_count="count",
        )
        .reset_index()
    )

    station_stats[
        "station_volume_std"
    ] = (
        station_stats[
            "station_volume_std"
        ]
        .fillna(0)
    )

    fallback_mean = float(
        train[
            "previous_hour_passengers"
        ].mean()
    )

    train = add_station_statistics(
        train,
        station_stats,
        fallback_mean,
    )

    valid = add_station_statistics(
        valid,
        station_stats,
        fallback_mean,
    )

    train_all = add_station_statistics(
        train_all,
        station_stats,
        fallback_mean,
    )

    test = add_station_statistics(
        test,
        station_stats,
        fallback_mean,
    )

    # ========================================================
    # 6. CATEGORICAL ENCODING
    # ========================================================

    print(
        "\nEncoding categorical features..."
    )

    encoders = {}

    for col in [
        "day_of_week",
        "weather",
        "event",
    ]:

        le = LabelEncoder()

        # Fit only on internal training data
        le.fit(
            train[col].astype(str)
        )

        encoders[col] = le

        for part in [
            train,
            valid,
            train_all,
            test,
        ]:

            mapping = {
                value: index
                for index, value
                in enumerate(
                    le.classes_
                )
            }

            part[col + "_e"] = (
                part[col]
                .astype(str)
                .map(mapping)
                .fillna(-1)
                .astype(int)
            )

    # ========================================================
    # 7. RE-CREATE EVENT X PEAK
    #
    # Use the final training-fitted event encoding.
    # ========================================================

    for part in [
        train,
        valid,
        train_all,
        test,
    ]:

        part["event_x_peak"] = (
            part["event_e"]
            *
            part["peak_hour"]
        )

        part["holiday_x_peak"] = (
            part["holiday"]
            *
            part["peak_hour"]
        )

    # ========================================================
    # 8. CHECK ALL FEATURES
    # ========================================================

    missing = [
        feature
        for feature in FEATURES
        if feature not in train.columns
    ]

    if missing:

        raise ValueError(
            "Missing engineered features:\n"
            +
            "\n".join(missing)
        )

    print(
        f"\nTotal engineered features: "
        f"{len(FEATURES)}"
    )

    for feature in FEATURES:

        print(
            f"  - {feature}"
        )

    # ========================================================
    # 9. FEATURE MATRICES
    # ========================================================

    X_train = (
        train[FEATURES]
        .astype(float)
    )

    X_valid = (
        valid[FEATURES]
        .astype(float)
    )

    X_full = (
        train_all[FEATURES]
        .astype(float)
    )

    X_test = (
        test[FEATURES]
        .astype(float)
    )

    # ========================================================
    # 10. TARGET ENCODING
    # ========================================================

    y_encoder = LabelEncoder()

    y_encoder.fit(LEVELS)

    y_train = y_encoder.transform(
        train[target]
    )

    y_valid = y_encoder.transform(
        valid[target]
    )

    y_full = y_encoder.transform(
        train_all[target]
    )

    y_test = y_encoder.transform(
        test[target]
    )

    print("\nClasses:")

    for i, cls in enumerate(
        y_encoder.classes_
    ):

        print(
            f"  {i}: {cls}"
        )

    # ========================================================
    # 11. RF CRITICAL
    # ========================================================

    print("\n" + "-" * 78)
    print("TRAINING RF CRITICAL")
    print("-" * 78)

    # LabelEncoder gives:
    #
    # 0 = Critical
    # 1 = High
    # 2 = Low
    # 3 = Medium
    #
    # Critical receives the strongest weight.

    rf_params = {

        "n_estimators": 800,

        "max_depth": None,

        "min_samples_leaf": 1,

        "max_features": "sqrt",

        "class_weight": {
            0: 2.5,   # Critical
            1: 1.0,   # High
            2: 1.5,   # Low
            3: 1.0,   # Medium
        },

        "n_jobs": -1,

        "random_state": RANDOM_STATE,
    }

    print(
        "\nRF parameters:"
    )

    print(
        json.dumps(
            rf_params,
            indent=2,
        )
    )

    # ========================================================
    # 12. VALIDATION RF
    # ========================================================

    rf_valid = RandomForestClassifier(
        **rf_params
    )

    rf_valid.fit(
        X_train,
        y_train,
    )

    pred_valid = rf_valid.predict(
        X_valid
    )

    valid_metrics = classification_metrics(
        y_valid,
        pred_valid,
    )

    print(
        "\nValidation results:"
    )

    print(
        f"Accuracy        : "
        f"{valid_metrics['accuracy'] * 100:.2f}%"
    )

    print(
        f"Macro-F1        : "
        f"{valid_metrics['macro_f1']:.4f}"
    )

    print(
        f"Macro Recall    : "
        f"{valid_metrics['macro_recall'] * 100:.2f}%"
    )

    print(
        f"Critical Recall : "
        f"{valid_metrics['recall_per_class']['Critical'] * 100:.2f}%"
    )

    # ========================================================
    # 13. FINAL RF TRAINING
    # ========================================================

    print("\n" + "=" * 78)
    print("FINAL RF CRITICAL TRAINING")
    print("=" * 78)

    print(
        "\nRetraining on training + validation period..."
    )

    rf_final = RandomForestClassifier(
        **rf_params
    )

    rf_final.fit(
        X_full,
        y_full,
    )

    # ========================================================
    # 14. FINAL TEST
    # ========================================================

    print(
        "\nEvaluating untouched final test..."
    )

    pred_test = rf_final.predict(
        X_test
    )

    final_metrics = classification_metrics(
        y_test,
        pred_test,
    )

    print("\n" + "=" * 78)
    print("FINAL RF CRITICAL RESULTS")
    print("=" * 78)

    print(
        f"Accuracy        : "
        f"{final_metrics['accuracy'] * 100:.2f}%"
    )

    print(
        f"Macro-F1        : "
        f"{final_metrics['macro_f1']:.4f}"
    )

    print(
        f"Macro Recall    : "
        f"{final_metrics['macro_recall'] * 100:.2f}%"
    )

    for level in LEVELS:

        print(
            f"{level + ' Recall':<17}: "
            f"{final_metrics['recall_per_class'][level] * 100:.2f}%"
        )

    print(
        "\nClassification report:"
    )

    print(
        classification_report(
            y_test,
            pred_test,
            target_names=y_encoder.classes_,
            zero_division=0,
        )
    )

    # ========================================================
    # 15. CONFUSION MATRIX
    # ========================================================

    cm = confusion_matrix(
        y_test,
        pred_test,
        labels=range(len(LEVELS)),
    )

    # ========================================================
    # 16. FEATURE IMPORTANCE
    # ========================================================

    feature_importance = sorted(
        [
            {
                "feature": feature,
                "importance": round(
                    float(importance),
                    5,
                ),
            }

            for feature, importance
            in zip(
                FEATURES,
                rf_final.feature_importances_,
            )
        ],

        key=lambda x:
            x["importance"],

        reverse=True,
    )

    # ========================================================
    # 17. DEMAND MODEL
    # ========================================================

    print("\n" + "=" * 78)
    print("TRAINING DEMAND MODEL — XGBOOST")
    print("=" * 78)

    y_train_d = (
        train[
            "future_passenger_count"
        ]
        .values
    )

    y_full_d = (
        train_all[
            "future_passenger_count"
        ]
        .values
    )

    y_test_d = (
        test[
            "future_passenger_count"
        ]
        .values
    )

    demand_model = XGBRegressor(

        n_estimators=500,

        max_depth=7,

        learning_rate=0.05,

        subsample=0.90,

        colsample_bytree=0.90,

        min_child_weight=2,

        gamma=0.05,

        reg_alpha=0.05,

        reg_lambda=1.0,

        objective="reg:squarederror",

        tree_method="hist",

        n_jobs=-1,

        random_state=RANDOM_STATE,
    )

    print(
        "\nDemand parameters:"
    )

    print(
        json.dumps(
            {
                "n_estimators": 500,
                "max_depth": 7,
                "learning_rate": 0.05,
                "subsample": 0.90,
                "colsample_bytree": 0.90,
                "min_child_weight": 2,
                "gamma": 0.05,
                "reg_alpha": 0.05,
                "reg_lambda": 1.0,
            },
            indent=2,
        )
    )

    demand_model.fit(
        X_full,
        y_full_d,
    )

    pred_demand = (
        demand_model.predict(
            X_test
        )
    )

    # ========================================================
    # 18. DEMAND METRICS
    # ========================================================

    mae = mean_absolute_error(
        y_test_d,
        pred_demand,
    )

    r2 = r2_score(
        y_test_d,
        pred_demand,
    )

    positive = (
        y_test_d > 0
    )

    if positive.any():

        mape = (
            np.mean(
                np.abs(
                    (
                        y_test_d[positive]
                        -
                        pred_demand[positive]
                    )
                    /
                    y_test_d[positive]
                )
            )
            * 100
        )

    else:

        mape = 0.0

    print(
        f"\nDemand MAE  : {mae:.2f}"
    )

    print(
        f"Demand MAPE : {mape:.2f}%"
    )

    print(
        f"Demand R²   : {r2:.4f}"
    )

    # ========================================================
    # 19. SAVE PRODUCTION MODELS
    # ========================================================

    print("\n" + "=" * 78)
    print("SAVING PRODUCTION MODELS")
    print("=" * 78)

    # Crowd model
    joblib.dump(
        rf_final,
        ART / "crowd_model.joblib",
    )

    # Demand model
    joblib.dump(
        demand_model,
        ART / "demand_model.joblib",
    )

    # Encoders + exact feature order
    joblib.dump(
        {
            "encoders": encoders,
            "label": y_encoder,
            "features": FEATURES,
        },
        ART / "encoders.joblib",
    )

    print(
        "\nSaved:"
    )

    print(
        ART / "crowd_model.joblib"
    )

    print(
        ART / "demand_model.joblib"
    )

    print(
        ART / "encoders.joblib"
    )

    # ========================================================
    # 20. METRICS JSON
    # ========================================================

    metrics = {

        "generated_from":
            "metro_ai_training_data.csv",

        "model_version":
            "RF-Critical-production-v2",

        "crowd_classifier": {

            "active_model":
                "random_forest_critical",

            "algorithm":
                "RandomForestClassifier",

            "parameters":
                rf_params,

            "validation":
                valid_metrics,

            "final_test":
                final_metrics,

            "previous_best_reference": {

                "accuracy":
                    0.8664,

                "macro_f1":
                    0.7827,

                "critical_recall":
                    0.8342,
            },

            "confusion_matrix":
                cm.tolist(),
        },

        "demand_regressor": {

            "algorithm":
                "XGBoost",

            "mae":
                round(
                    float(mae),
                    2,
                ),

            "mape_pct":
                round(
                    float(mape),
                    2,
                ),

            "r2":
                round(
                    float(r2),
                    4,
                ),
        },

        "feature_importance":
            feature_importance,

        "features":
            FEATURES,

        "rows": {

            "total":
                int(len(df)),

            "training":
                int(len(train_all)),

            "testing":
                int(len(test)),
        },

        "split_date":
            SPLIT_DATE,
    }

    metrics_file = (
        ART / "model_metrics.json"
    )

    metrics_file.write_text(
        json.dumps(
            metrics,
            indent=2,
        )
    )

    # ========================================================
    # 21. FRONTEND METRICS
    # ========================================================

    WEB_OUT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    WEB_OUT.write_text(
        json.dumps(
            metrics,
            indent=2,
        )
    )

    # ========================================================
    # 22. FINAL SUMMARY
    # ========================================================

    print("\n" + "=" * 78)
    print("FINAL PRODUCTION MODEL")
    print("=" * 78)

    print(
        "\nCrowd model : "
        "Random Forest — RF Critical"
    )

    print(
        f"Accuracy    : "
        f"{final_metrics['accuracy'] * 100:.2f}%"
    )

    print(
        f"Macro-F1    : "
        f"{final_metrics['macro_f1']:.4f}"
    )

    print(
        f"Macro Recall: "
        f"{final_metrics['macro_recall'] * 100:.2f}%"
    )

    print(
        f"Critical    : "
        f"{final_metrics['recall_per_class']['Critical'] * 100:.2f}%"
    )

    print(
        "\nDemand model : XGBoost"
    )

    print(
        f"Demand MAE  : {mae:.2f}"
    )

    print(
        f"Demand MAPE : {mape:.2f}%"
    )

    print(
        f"Demand R²   : {r2:.4f}"
    )

    print(
        "\nProduction crowd model saved to:"
    )

    print(
        ART / "crowd_model.joblib"
    )

    print(
        "\nProduction demand model saved to:"
    )

    print(
        ART / "demand_model.joblib"
    )

    print(
        "\nEncoders saved to:"
    )

    print(
        ART / "encoders.joblib"
    )

    print(
        "\nMetrics saved to:"
    )

    print(
        ART / "model_metrics.json"
    )

    print(
        "\nFrontend metrics saved to:"
    )

    print(
        WEB_OUT
    )

    print(
        "\nFastAPI/frontend source files were NOT modified."
    )

    print(
        "\nTraining completed successfully."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()
