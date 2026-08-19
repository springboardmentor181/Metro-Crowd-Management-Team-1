"""
MetroFlow — Advanced AI Model Comparison & Hyperparameter Tuning

IMPORTANT:
This is an EXPERIMENT ONLY.

It does NOT modify:
    - train.py
    - artifacts/crowd_model.joblib
    - artifacts/demand_model.joblib
    - artifacts/encoders.joblib
    - artifacts/model_metrics.json
    - frontend
    - FastAPI
    - predictor.py

It uses the same dataset and features as the existing production model.

Models tested:

Crowd classification:
    - Extra Trees
    - Random Forest
    - XGBoost
    - LightGBM
    - CatBoost

Passenger demand regression:
    - Extra Trees
    - Random Forest
    - XGBoost
    - LightGBM
    - CatBoost

The training period is split into:

    Earlier period  -> internal training
    Later training  -> validation
    Final period    -> untouched test

This avoids repeatedly tuning directly on the final test set.

The final test set is used only after the best parameters
have been selected using the validation period.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    r2_score,
    recall_score,
)

from sklearn.preprocessing import LabelEncoder

from xgboost import XGBClassifier, XGBRegressor

from lightgbm import (
    LGBMClassifier,
    LGBMRegressor,
)

from catboost import (
    CatBoostClassifier,
    CatBoostRegressor,
)


# ============================================================
# PATHS
# ============================================================

HERE = Path(__file__).resolve().parent

# metroflow/
ROOT = HERE.parents[1]

# Project root / MetroFlow_Dataset
DATA = (
    ROOT.parent
    / "MetroFlow_Dataset"
    / "metro_ai_training_data.csv"
)

# Experimental output only
RESULTS_FILE = HERE / "comparison_results.json"


# ============================================================
# CONFIGURATION
# ============================================================

LEVELS = [
    "Low",
    "Medium",
    "High",
    "Critical",
]

CAT_COLS = [
    "day_of_week",
    "weather",
    "event",
]

NUM_COLS = [
    "hour",
    "previous_hour_passengers",
    "previous_day_average",
    "holiday",
    "train_frequency",
    "occupancy",
]

# Same final split used by your existing train.py
FINAL_TEST_DATE = "2024-12-15"

# The validation period is taken from the end of the
# original training period.
#
# 2024-11-15 -> 2024-12-15 = validation
VALIDATION_START = "2024-11-15"

RANDOM_STATE = 42

# Number of parameter combinations to test.
# Keeping this moderate prevents extremely long training time.
N_TUNING_TRIALS = 8


# ============================================================
# UTILITY
# ============================================================

def print_separator(title: str):

    print("\n")
    print("=" * 78)
    print(title)
    print("=" * 78)


# ============================================================
# CLASSIFICATION METRICS
# ============================================================

def classification_metrics(
    y_true,
    y_pred,
):

    recalls = recall_score(
        y_true,
        y_pred,
        average=None,
        labels=range(len(LEVELS)),
        zero_division=0,
    )

    return {
        "accuracy": float(
            accuracy_score(
                y_true,
                y_pred,
            )
        ),

        "macro_f1": float(
            f1_score(
                y_true,
                y_pred,
                average="macro",
            )
        ),

        "critical_recall": float(
            recalls[
                LEVELS.index("Critical")
            ]
        ),

        "recall_per_class": {
            level: float(value)
            for level, value in zip(
                LEVELS,
                recalls,
            )
        },
    }


# ============================================================
# REGRESSION METRICS
# ============================================================

def regression_metrics(
    y_true,
    y_pred,
):

    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    mask = y_true > 0

    if np.any(mask):

        mape = (
            np.mean(
                np.abs(
                    (
                        y_true[mask]
                        - y_pred[mask]
                    )
                    / y_true[mask]
                )
            )
            * 100
        )

    else:

        mape = 0.0

    return {
        "mae": float(
            mean_absolute_error(
                y_true,
                y_pred,
            )
        ),

        "mape": float(mape),

        "r2": float(
            r2_score(
                y_true,
                y_pred,
            )
        ),
    }


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print_separator(
        "LOADING METROFLOW DATASET"
    )

    print(
        f"Dataset:\n{DATA}"
    )

    if not DATA.exists():

        raise FileNotFoundError(
            f"\nDataset not found:\n{DATA}"
        )

    df = pd.read_csv(DATA)

    # Dataset contains dates such as:
    # 13-10-2024
    df["date"] = pd.to_datetime(
        df["date"],
        dayfirst=True,
    )

    df["holiday"] = (
        df["holiday"]
        .astype(int)
    )

    print(
        f"\nTotal rows: {len(df):,}"
    )

    return df


# ============================================================
# PREPARE FEATURES
# ============================================================

def prepare_features(df):

    print_separator(
        "PREPARING FEATURES"
    )

    for col in CAT_COLS:

        encoder = LabelEncoder()

        df[col + "_e"] = (
            encoder.fit_transform(
                df[col].astype(str)
            )
        )

    features = (
        NUM_COLS
        + [
            col + "_e"
            for col in CAT_COLS
        ]
    )

    print(
        "\nFeatures used:"
    )

    for feature in features:

        print(
            f"  - {feature}"
        )

    return df, features


# ============================================================
# TIME-BASED SPLIT
# ============================================================

def create_splits(
    df,
    features,
):

    print_separator(
        "TIME-BASED DATA SPLIT"
    )

    # Final untouched test set
    train_period = df[
        df["date"]
        < FINAL_TEST_DATE
    ].copy()

    test = df[
        df["date"]
        >= FINAL_TEST_DATE
    ].copy()

    # Internal validation period
    internal_train = train_period[
        train_period["date"]
        < VALIDATION_START
    ].copy()

    validation = train_period[
        train_period["date"]
        >= VALIDATION_START
    ].copy()

    print(
        f"Internal training rows : "
        f"{len(internal_train):,}"
    )

    print(
        f"Validation rows        : "
        f"{len(validation):,}"
    )

    print(
        f"Final test rows        : "
        f"{len(test):,}"
    )

    print(
        "\nFinal test set remains untouched "
        "during hyperparameter tuning."
    )

    X_train = internal_train[
        features
    ]

    X_val = validation[
        features
    ]

    X_test = test[
        features
    ]

    return (
        internal_train,
        validation,
        test,
        X_train,
        X_val,
        X_test,
    )


# ============================================================
# CROWD TARGET PREPARATION
# ============================================================

def prepare_crowd_targets(
    internal_train,
    validation,
    test,
):

    label = LabelEncoder()

    label.fit(LEVELS)

    y_train = label.transform(
        internal_train[
            "future_crowd_level"
        ]
    )

    y_val = label.transform(
        validation[
            "future_crowd_level"
        ]
    )

    y_test = label.transform(
        test[
            "future_crowd_level"
        ]
    )

    return (
        y_train,
        y_val,
        y_test,
    )


# ============================================================
# CLASS WEIGHTS
# ============================================================

def calculate_class_weights(
    y_train,
):

    counts = np.bincount(
        y_train,
        minlength=len(LEVELS),
    )

    weights = (
        counts.sum()
        / (
            len(LEVELS)
            * np.maximum(
                counts,
                1,
            )
        )
    )

    sample_weights = (
        weights[y_train]
    )

    print(
        "\nClass distribution:"
    )

    for level, count in zip(
        LEVELS,
        counts,
    ):

        print(
            f"{level:<10}: "
            f"{count:,}"
        )

    return (
        weights,
        sample_weights,
    )


# ============================================================
# CROWD MODEL PARAMETER SEARCH
# ============================================================

def get_crowd_candidates():

    return {

        "Extra Trees": [

            {
                "n_estimators": 500,
                "max_depth": 18,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
            },

            {
                "n_estimators": 600,
                "max_depth": 24,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
            },

            {
                "n_estimators": 600,
                "max_depth": None,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
            },

            {
                "n_estimators": 600,
                "max_depth": 24,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": None,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": 30,
                "min_samples_leaf": 2,
                "max_features": 1.0,
            },

            {
                "n_estimators": 700,
                "max_depth": 20,
                "min_samples_leaf": 2,
                "max_features": "log2",
            },

            {
                "n_estimators": 700,
                "max_depth": 28,
                "min_samples_leaf": 1,
                "max_features": 0.7,
            },
        ],

        "Random Forest": [

            {
                "n_estimators": 500,
                "max_depth": 18,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
            },

            {
                "n_estimators": 600,
                "max_depth": 24,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
            },

            {
                "n_estimators": 700,
                "max_depth": None,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
            },

            {
                "n_estimators": 600,
                "max_depth": 24,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": 30,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 700,
                "max_depth": 20,
                "min_samples_leaf": 2,
                "max_features": "log2",
            },

            {
                "n_estimators": 800,
                "max_depth": None,
                "min_samples_leaf": 2,
                "max_features": 1.0,
            },

            {
                "n_estimators": 600,
                "max_depth": 16,
                "min_samples_leaf": 2,
                "max_features": 0.7,
            },
        ],

        "XGBoost": [

            {
                "n_estimators": 500,
                "max_depth": 5,
                "learning_rate": 0.05,
                "subsample": 0.9,
                "colsample_bytree": 0.9,
                "min_child_weight": 2,
                "gamma": 0.0,
            },

            {
                "n_estimators": 700,
                "max_depth": 6,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 0.9,
                "min_child_weight": 2,
                "gamma": 0.0,
            },

            {
                "n_estimators": 700,
                "max_depth": 7,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 0.9,
                "min_child_weight": 2,
                "gamma": 0.05,
            },

            {
                "n_estimators": 800,
                "max_depth": 6,
                "learning_rate": 0.05,
                "subsample": 0.85,
                "colsample_bytree": 0.9,
                "min_child_weight": 3,
                "gamma": 0.05,
            },

            {
                "n_estimators": 800,
                "max_depth": 8,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 0.85,
                "min_child_weight": 2,
                "gamma": 0.05,
            },

            {
                "n_estimators": 600,
                "max_depth": 7,
                "learning_rate": 0.04,
                "subsample": 0.85,
                "colsample_bytree": 0.85,
                "min_child_weight": 4,
                "gamma": 0.1,
            },

            {
                "n_estimators": 900,
                "max_depth": 5,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 1.0,
                "min_child_weight": 1,
                "gamma": 0.0,
            },

            {
                "n_estimators": 700,
                "max_depth": 8,
                "learning_rate": 0.04,
                "subsample": 0.85,
                "colsample_bytree": 0.9,
                "min_child_weight": 3,
                "gamma": 0.1,
            },
        ],
    }


# ============================================================
# CREATE CROWD MODEL
# ============================================================

def create_crowd_model(
    model_name,
    params,
    class_weights,
):

    if model_name == "Extra Trees":

        return ExtraTreesClassifier(
            **params,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )

    if model_name == "Random Forest":

        return RandomForestClassifier(
            **params,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )

    if model_name == "XGBoost":

        return XGBClassifier(
            **params,
            objective="multi:softprob",
            num_class=4,
            tree_method="hist",
            n_jobs=-1,
            eval_metric="mlogloss",
            random_state=RANDOM_STATE,
        )

    raise ValueError(
        f"Unknown crowd model: {model_name}"
    )


# ============================================================
# TUNE CROWD MODELS
# ============================================================

def tune_crowd_models(
    X_train,
    y_train,
    X_val,
    y_val,
    sample_weights,
    class_weights,
):

    print_separator(
        "CROWD MODEL HYPERPARAMETER TUNING"
    )

    candidates = (
        get_crowd_candidates()
    )

    validation_results = []

    for model_name, parameter_list in candidates.items():

        print(
            f"\n{'=' * 60}"
        )

        print(
            f"Tuning {model_name}"
        )

        print(
            f"{'=' * 60}"
        )

        for trial, params in enumerate(
            parameter_list,
            start=1,
        ):

            print(
                f"\nTrial "
                f"{trial}/{len(parameter_list)}"
            )

            print(
                params
            )

            model = create_crowd_model(
                model_name,
                params,
                class_weights,
            )

            if model_name == "XGBoost":

                model.fit(
                    X_train,
                    y_train,
                    sample_weight=sample_weights,
                )

            else:

                model.fit(
                    X_train,
                    y_train,
                )

            predictions = model.predict(
                X_val
            )

            metrics = classification_metrics(
                y_val,
                predictions,
            )

            print(
                f"Accuracy: "
                f"{metrics['accuracy'] * 100:.2f}%"
            )

            print(
                f"Macro-F1: "
                f"{metrics['macro_f1']:.4f}"
            )

            print(
                f"Critical recall: "
                f"{metrics['critical_recall'] * 100:.2f}%"
            )

            validation_results.append(
                {
                    "model": model_name,
                    "params": params,
                    **metrics,
                }
            )

    # Sort primarily by Macro-F1
    validation_results.sort(
        key=lambda x: (
            x["macro_f1"],
            x["critical_recall"],
        ),
        reverse=True,
    )

    print_separator(
        "BEST CROWD VALIDATION RESULTS"
    )

    print(
        f"{'Model':<18}"
        f"{'Accuracy':>12}"
        f"{'Macro-F1':>12}"
        f"{'Critical':>14}"
    )

    print("-" * 60)

    for result in validation_results[:10]:

        print(
            f"{result['model']:<18}"
            f"{result['accuracy'] * 100:>11.2f}%"
            f"{result['macro_f1']:>12.4f}"
            f"{result['critical_recall'] * 100:>13.2f}%"
        )

    return validation_results


# ============================================================
# DEMAND PARAMETER CANDIDATES
# ============================================================

def get_demand_candidates():

    return {

        "Extra Trees": [

            {
                "n_estimators": 500,
                "max_depth": 18,
                "min_samples_leaf": 1,
                "max_features": 1.0,
            },

            {
                "n_estimators": 600,
                "max_depth": 24,
                "min_samples_leaf": 1,
                "max_features": 1.0,
            },

            {
                "n_estimators": 700,
                "max_depth": None,
                "min_samples_leaf": 1,
                "max_features": 1.0,
            },

            {
                "n_estimators": 700,
                "max_depth": 24,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": 30,
                "min_samples_leaf": 2,
                "max_features": 1.0,
            },

            {
                "n_estimators": 700,
                "max_depth": None,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": 20,
                "min_samples_leaf": 1,
                "max_features": 0.8,
            },

            {
                "n_estimators": 600,
                "max_depth": 28,
                "min_samples_leaf": 2,
                "max_features": "sqrt",
            },
        ],

        "Random Forest": [

            {
                "n_estimators": 500,
                "max_depth": 18,
                "min_samples_leaf": 1,
                "max_features": 1.0,
            },

            {
                "n_estimators": 600,
                "max_depth": 24,
                "min_samples_leaf": 1,
                "max_features": 1.0,
            },

            {
                "n_estimators": 700,
                "max_depth": None,
                "min_samples_leaf": 1,
                "max_features": 1.0,
            },

            {
                "n_estimators": 700,
                "max_depth": 24,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": 30,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 800,
                "max_depth": None,
                "min_samples_leaf": 2,
                "max_features": 0.8,
            },

            {
                "n_estimators": 700,
                "max_depth": 20,
                "min_samples_leaf": 1,
                "max_features": 0.8,
            },

            {
                "n_estimators": 600,
                "max_depth": 28,
                "min_samples_leaf": 2,
                "max_features": 1.0,
            },
        ],

        "XGBoost": [

            {
                "n_estimators": 500,
                "max_depth": 5,
                "learning_rate": 0.05,
                "subsample": 0.9,
                "colsample_bytree": 0.9,
            },

            {
                "n_estimators": 700,
                "max_depth": 6,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 0.9,
            },

            {
                "n_estimators": 800,
                "max_depth": 7,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 0.9,
            },

            {
                "n_estimators": 900,
                "max_depth": 6,
                "learning_rate": 0.03,
                "subsample": 0.85,
                "colsample_bytree": 0.9,
            },

            {
                "n_estimators": 700,
                "max_depth": 8,
                "learning_rate": 0.03,
                "subsample": 0.9,
                "colsample_bytree": 0.85,
            },

            {
                "n_estimators": 800,
                "max_depth": 7,
                "learning_rate": 0.04,
                "subsample": 0.85,
                "colsample_bytree": 0.85,
            },

            {
                "n_estimators": 1000,
                "max_depth": 5,
                "learning_rate": 0.025,
                "subsample": 0.9,
                "colsample_bytree": 1.0,
            },

            {
                "n_estimators": 900,
                "max_depth": 8,
                "learning_rate": 0.025,
                "subsample": 0.85,
                "colsample_bytree": 0.9,
            },
        ],
    }


# ============================================================
# CREATE DEMAND MODEL
# ============================================================

def create_demand_model(
    model_name,
    params,
):

    if model_name == "Extra Trees":

        return ExtraTreesRegressor(
            **params,
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )

    if model_name == "Random Forest":

        return RandomForestRegressor(
            **params,
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )

    if model_name == "XGBoost":

        return XGBRegressor(
            **params,
            objective="reg:squarederror",
            tree_method="hist",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )

    raise ValueError(
        f"Unknown demand model: {model_name}"
    )


# ============================================================
# TUNE DEMAND MODELS
# ============================================================

def tune_demand_models(
    X_train,
    y_train,
    X_val,
    y_val,
):

    print_separator(
        "DEMAND MODEL HYPERPARAMETER TUNING"
    )

    candidates = (
        get_demand_candidates()
    )

    validation_results = []

    for model_name, parameter_list in candidates.items():

        print(
            f"\n{'=' * 60}"
        )

        print(
            f"Tuning {model_name}"
        )

        print(
            f"{'=' * 60}"
        )

        for trial, params in enumerate(
            parameter_list,
            start=1,
        ):

            print(
                f"\nTrial "
                f"{trial}/{len(parameter_list)}"
            )

            print(
                params
            )

            model = create_demand_model(
                model_name,
                params,
            )

            model.fit(
                X_train,
                y_train,
            )

            predictions = model.predict(
                X_val
            )

            metrics = regression_metrics(
                y_val,
                predictions,
            )

            print(
                f"MAE: "
                f"{metrics['mae']:.2f}"
            )

            print(
                f"MAPE: "
                f"{metrics['mape']:.2f}%"
            )

            print(
                f"R²: "
                f"{metrics['r2']:.4f}"
            )

            validation_results.append(
                {
                    "model": model_name,
                    "params": params,
                    **metrics,
                }
            )

    # Highest R² first
    validation_results.sort(
        key=lambda x: x["r2"],
        reverse=True,
    )

    print_separator(
        "BEST DEMAND VALIDATION RESULTS"
    )

    print(
        f"{'Model':<18}"
        f"{'MAE':>14}"
        f"{'MAPE':>14}"
        f"{'R²':>12}"
    )

    print("-" * 60)

    for result in validation_results[:10]:

        print(
            f"{result['model']:<18}"
            f"{result['mae']:>14.2f}"
            f"{result['mape']:>13.2f}%"
            f"{result['r2']:>12.4f}"
        )

    return validation_results


# ============================================================
# FINAL TEST EVALUATION
# ============================================================

def final_test_evaluation(
    crowd_best,
    demand_best,
    X_train_full,
    y_train_crowd_full,
    y_train_demand_full,
    X_test,
    y_test_crowd,
    y_test_demand,
    sample_weights_full,
    class_weights,
):

    print_separator(
        "FINAL TEST EVALUATION"
    )

    # --------------------------------------------------------
    # Crowd
    # --------------------------------------------------------

    crowd_name = (
        crowd_best["model"]
    )

    crowd_params = (
        crowd_best["params"]
    )

    print(
        f"\nFinal crowd model: "
        f"{crowd_name}"
    )

    crowd_model = create_crowd_model(
        crowd_name,
        crowd_params,
        class_weights,
    )

    if crowd_name == "XGBoost":

        crowd_model.fit(
            X_train_full,
            y_train_crowd_full,
            sample_weight=sample_weights_full,
        )

    else:

        crowd_model.fit(
            X_train_full,
            y_train_crowd_full,
        )

    crowd_pred = (
        crowd_model.predict(
            X_test
        )
    )

    crowd_test_metrics = (
        classification_metrics(
            y_test_crowd,
            crowd_pred,
        )
    )

    # --------------------------------------------------------
    # Demand
    # --------------------------------------------------------

    demand_name = (
        demand_best["model"]
    )

    demand_params = (
        demand_best["params"]
    )

    print(
        f"Final demand model: "
        f"{demand_name}"
    )

    demand_model = create_demand_model(
        demand_name,
        demand_params,
    )

    demand_model.fit(
        X_train_full,
        y_train_demand_full,
    )

    demand_pred = (
        demand_model.predict(
            X_test
        )
    )

    demand_test_metrics = (
        regression_metrics(
            y_test_demand,
            demand_pred,
        )
    )

    return (
        crowd_test_metrics,
        demand_test_metrics,
    )


# ============================================================
# MAIN
# ============================================================

def main():

    random.seed(
        RANDOM_STATE
    )

    np.random.seed(
        RANDOM_STATE
    )

    # ========================================================
    # LOAD
    # ========================================================

    df = load_data()

    # ========================================================
    # FEATURES
    # ========================================================

    (
        df,
        features,
    ) = prepare_features(
        df
    )

    # ========================================================
    # SPLIT
    # ========================================================

    (
        internal_train,
        validation,
        test,
        X_train,
        X_val,
        X_test,
    ) = create_splits(
        df,
        features,
    )

    # ========================================================
    # CROWD TARGETS
    # ========================================================

    (
        y_train_crowd,
        y_val_crowd,
        y_test_crowd,
    ) = prepare_crowd_targets(
        internal_train,
        validation,
        test,
    )

    (
        class_weights,
        sample_weights,
    ) = calculate_class_weights(
        y_train_crowd
    )

    # ========================================================
    # CROWD TUNING
    # ========================================================

    crowd_results = (
        tune_crowd_models(
            X_train,
            y_train_crowd,
            X_val,
            y_val_crowd,
            sample_weights,
            class_weights,
        )
    )

    best_crowd = (
        crowd_results[0]
    )

    # ========================================================
    # DEMAND TARGETS
    # ========================================================

    y_train_demand = (
        internal_train[
            "future_passenger_count"
        ].values
    )

    y_val_demand = (
        validation[
            "future_passenger_count"
        ].values
    )

    y_test_demand = (
        test[
            "future_passenger_count"
        ].values
    )

    # ========================================================
    # DEMAND TUNING
    # ========================================================

    demand_results = (
        tune_demand_models(
            X_train,
            y_train_demand,
            X_val,
            y_val_demand,
        )
    )

    best_demand = (
        demand_results[0]
    )

    # ========================================================
    # FULL TRAINING DATA
    # ========================================================

    print_separator(
        "RETRAINING SELECTED MODELS ON FULL TRAINING PERIOD"
    )

    X_train_full = train_features = (
        pd.concat(
            [
                internal_train,
                validation,
            ],
            axis=0,
        )[features]
    )

    y_train_crowd_full = (
        LabelEncoder()
        .fit(LEVELS)
        .transform(
            pd.concat(
                [
                    internal_train[
                        "future_crowd_level"
                    ],
                    validation[
                        "future_crowd_level"
                    ],
                ]
            )
        )
    )

    # Calculate full-training crowd weights
    counts_full = np.bincount(
        y_train_crowd_full,
        minlength=len(LEVELS),
    )

    weights_full = (
        counts_full.sum()
        / (
            len(LEVELS)
            * np.maximum(
                counts_full,
                1,
            )
        )
    )

    sample_weights_full = (
        weights_full[
            y_train_crowd_full
        ]
    )

    y_train_demand_full = (
        pd.concat(
            [
                internal_train[
                    "future_passenger_count"
                ],
                validation[
                    "future_passenger_count"
                ],
            ]
        ).values
    )

    # ========================================================
    # FINAL TEST
    # ========================================================

    (
        crowd_test_metrics,
        demand_test_metrics,
    ) = final_test_evaluation(
        best_crowd,
        best_demand,
        X_train_full,
        y_train_crowd_full,
        y_train_demand_full,
        X_test,
        y_test_crowd,
        y_test_demand,
        sample_weights_full,
        weights_full,
    )

    # ========================================================
    # FINAL RESULTS
    # ========================================================

    print_separator(
        "FINAL CROWD MODEL RESULT"
    )

    print(
        f"Model           : "
        f"{best_crowd['model']}"
    )

    print(
        f"Accuracy        : "
        f"{crowd_test_metrics['accuracy'] * 100:.2f}%"
    )

    print(
        f"Macro-F1        : "
        f"{crowd_test_metrics['macro_f1']:.4f}"
    )

    print(
        f"Critical Recall : "
        f"{crowd_test_metrics['critical_recall'] * 100:.2f}%"
    )

    print(
        "\nRecall per class:"
    )

    for level, value in (
        crowd_test_metrics[
            "recall_per_class"
        ].items()
    ):

        print(
            f"  {level:<10}: "
            f"{value * 100:.2f}%"
        )

    print_separator(
        "FINAL DEMAND MODEL RESULT"
    )

    print(
        f"Model : "
        f"{best_demand['model']}"
    )

    print(
        f"MAE   : "
        f"{demand_test_metrics['mae']:.2f}"
    )

    print(
        f"MAPE  : "
        f"{demand_test_metrics['mape']:.2f}%"
    )

    print(
        f"R²    : "
        f"{demand_test_metrics['r2']:.4f}"
    )

    # ========================================================
    # SAVE EXPERIMENT RESULTS ONLY
    # ========================================================

    results = {

        "experiment": (
            "advanced_model_comparison"
        ),

        "dataset": (
            "metro_ai_training_data.csv"
        ),

        "rows_total": int(
            len(df)
        ),

        "internal_training_rows": int(
            len(internal_train)
        ),

        "validation_rows": int(
            len(validation)
        ),

        "final_test_rows": int(
            len(test)
        ),

        "final_test_date": (
            FINAL_TEST_DATE
        ),

        "crowd_validation_results": (
            crowd_results
        ),

        "demand_validation_results": (
            demand_results
        ),

        "selected_crowd_model": (
            best_crowd
        ),

        "selected_demand_model": (
            best_demand
        ),

        "final_test_crowd": (
            crowd_test_metrics
        ),

        "final_test_demand": (
            demand_test_metrics
        ),
    }

    RESULTS_FILE.write_text(
        json.dumps(
            results,
            indent=2,
        )
    )

    # ========================================================
    # SAFETY MESSAGE
    # ========================================================

    print_separator(
        "EXPERIMENT COMPLETED"
    )

    print(
        f"Experiment results saved to:\n"
        f"{RESULTS_FILE}"
    )

    print(
        "\nIMPORTANT:"
    )

    print(
        "train.py was NOT modified."
    )

    print(
        "Existing .joblib artifacts were NOT modified."
    )

    print(
        "model_metrics.json was NOT modified."
    )

    print(
        "FastAPI was NOT modified."
    )

    print(
        "Frontend was NOT modified."
    )

    print(
        "\nCurrent production system remains unchanged."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()