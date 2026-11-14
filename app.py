"""SalesVista AI forecasting and anomaly detection service.

Run:  python app.py   (or: uvicorn app:app --reload --port 8000)
"""
import os
from typing import List, Optional

import lightgbm as lgb
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy.stats import norm
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression

QUANTILES = (0.10, 0.50, 0.90)
MIN_HISTORY_DAYS = 3

app = FastAPI(title="SalesVista AI Analytics Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173",
    ).split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------
class SalesRecord(BaseModel):
    date: str
    sku_id: str
    category: str
    observed_sales: float
    in_stock: int
    price: float
    promo_flag: int
    unit_cost: Optional[float] = None
    transaction_count: Optional[int] = None
    store_cluster: Optional[str] = "Tier-1"


class ForecastRequest(BaseModel):
    horizon_days: int = Field(30, ge=1, le=365)
    history: List[SalesRecord] = []


class AnomalyDetectionRequest(BaseModel):
    window_days: int = Field(7, ge=3, le=60, description="Rolling window size for baseline")
    threshold_sigma: float = Field(2.5, ge=1.5, le=5.0, description="Modified Z-score threshold")
    peer_threshold_ratio: float = Field(
        2.0, ge=1.2, le=4.0, description="Peer discrepancy IQR trigger ratio"
    )
    min_margin_pct_threshold: float = Field(
        15.0, ge=0.0, le=50.0, description="Minimum acceptable margin % before flagging"
    )
    contamination_rate: float = Field(
        0.05, ge=0.01, le=0.20, description="Expected proportion of outliers for Isolation Forest"
    )
    history: List[SalesRecord] = []


class AnomalyFeedbackRequest(BaseModel):
    sku_id: str
    date: str
    feedback_status: str = Field("EXPECTED", description="EXPECTED, CONFIRMED_ISSUE, or RESOLVED")
    notes: Optional[str] = ""


# Feature 5: In-memory registry for reviewed operator feedback
ACKNOWLEDGED_ANOMALIES = {}


# ---------------------------------------------------------
# Forecasting Logic
# ---------------------------------------------------------
def _dow_features(dow):
    angle = 2 * np.pi * dow / 7
    return np.sin(angle), np.cos(angle)


def correct_censored_demand(df: pd.DataFrame, window: int = 14) -> pd.DataFrame:
    df = df.sort_values(["sku_id", "date"]).reset_index(drop=True)
    df["unconstrained_demand"] = df["observed_sales"].astype(float)

    for _, g in df.groupby("sku_id"):
        valid = g["observed_sales"].where(g["in_stock"] == 1)
        mean = valid.rolling(window, min_periods=1).mean().bfill().ffill().fillna(0.0)
        std = valid.rolling(window, min_periods=1).std().bfill().ffill().fillna(1.0)

        censored = g["in_stock"] == 0
        mu = mean[censored]
        sigma = np.maximum(std[censored], 1e-3)
        alpha = -mu / sigma
        hazard = norm.pdf(alpha) / (1.0 - norm.cdf(alpha) + 1e-6)
        df.loc[g.index[censored], "unconstrained_demand"] = np.round(mu + sigma * hazard, 2)
    return df


def forecast_sku(group: pd.DataFrame, horizon_days: int) -> list:
    group = group.sort_values("date").reset_index(drop=True)
    sku_id, category = group["sku_id"].iloc[0], group["category"].iloc[0]
    demand = group["unconstrained_demand"].to_numpy()

    future = pd.date_range(group["date"].max() + pd.Timedelta(days=1), periods=horizon_days, freq="D")

    # Handle sparse series (< 3 observations) gracefully without crashing
    if len(group) < 3:
        avg_demand = max(0.0, float(np.mean(demand)))
        p50_val = round(avg_demand, 2)
        p10_val = round(max(0.0, p50_val * 0.8), 2)
        p90_val = round(max(0.0, p50_val * 1.25), 2)
        return [
            {
                "date": day.strftime("%Y-%m-%d"),
                "sku_id": sku_id,
                "category": category,
                "pred_p10": p10_val,
                "pred_p50": p50_val,
                "pred_p90": p90_val,
                "elasticity": -1.25,
            }
            for day in future
        ]

    # Series with >= 3 observations: Full LightGBM quantile regression
    log_price = np.log(np.maximum(group["price"].to_numpy(), 1e-4)).reshape(-1, 1)
    std_log_p = float(np.std(log_price))
    if std_log_p >= 0.02:
        try:
            lr = LinearRegression().fit(log_price, np.log(np.maximum(demand, 1e-3)))
            elasticity = float(lr.coef_[0])
            elasticity = min(max(elasticity, -3.0), -0.3)
        except Exception:
            elasticity = -1.25
    else:
        # If historical price has zero/minimal variance, use empirical retail baseline
        elasticity = -1.25

    sin_dow, cos_dow = _dow_features(group["date"].dt.dayofweek.to_numpy())
    train = np.column_stack([
        sin_dow,
        cos_dow,
        pd.Series(demand).shift(7).bfill().to_numpy(),
        group["promo_flag"].to_numpy(),
    ])
    y_adj = demand / np.exp(elasticity * log_price.ravel())

    min_child = max(1, min(5, len(group) // 2))
    models = [
        lgb.LGBMRegressor(
            objective="quantile",
            alpha=q,
            n_estimators=60,
            learning_rate=0.08,
            min_child_samples=min_child,
            verbose=-1,
            random_state=42,
            n_jobs=1,
        ).fit(train, y_adj)
        for q in QUANTILES
    ]

    price_factor = float(np.exp(elasticity * log_price[-1, 0]))
    sin_f, cos_f = _dow_features(future.dayofweek.to_numpy())
    is_weekend = (future.dayofweek >= 5).astype(int)
    model_p10, model_p50, model_p90 = models

    history = list(demand[-14:])
    features = []
    for i in range(horizon_days):
        lag_7 = history[-7] if len(history) >= 7 else float(np.mean(history))
        x = [sin_f[i], cos_f[i], lag_7, is_weekend[i]]
        history.append(max(0.0, float(model_p50.predict([x])[0]) * price_factor))
        features.append(x)

    X = np.array(features)
    p10 = np.maximum(model_p10.predict(X) * price_factor, 0.0)
    p90 = np.maximum(model_p90.predict(X) * price_factor, 0.0)
    p50 = history[-horizon_days:]

    return [
        {
            "date": day.strftime("%Y-%m-%d"),
            "sku_id": sku_id,
            "category": category,
            "pred_p10": round(float(p10[i]), 2),
            "pred_p50": round(p50[i], 2),
            "pred_p90": round(float(p90[i]), 2),
            "elasticity": round(elasticity, 3),
        }
        for i, day in enumerate(future)
    ]


def generate_forecast_pipeline(df: pd.DataFrame, horizon_days: int) -> list:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = correct_censored_demand(df)
    return [row for _, g in df.groupby("sku_id") for row in forecast_sku(g, horizon_days)]


# ---------------------------------------------------------
# Feature 4: Isolation Forest Engine
# ---------------------------------------------------------
def compute_isolation_forest_scores(df: pd.DataFrame, contamination: float = 0.05) -> pd.Series:
    """Computes unsupervised multi-dimensional anomaly scores across sales, price, and stock status."""
    if len(df) < 5:
        return pd.Series([0.5] * len(df), index=df.index)

    feature_cols = ["observed_sales", "price", "promo_flag", "in_stock"]
    X = df[feature_cols].fillna(0.0).to_numpy()

    iso_forest = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    iso_forest.fit(X)
    raw_scores = iso_forest.decision_function(X)
    norm_scores = 1.0 / (1.0 + np.exp(raw_scores * 5.0))
    return pd.Series(norm_scores, index=df.index)


# ---------------------------------------------------------
# Features 1, 2, 3, 4 & 5: Detection Pipeline
# ---------------------------------------------------------
def detect_hybrid_anomalies(
    df: pd.DataFrame,
    window: int = 7,
    threshold: float = 2.5,
    peer_threshold: float = 2.0,
    min_margin_threshold: float = 15.0,
    contamination: float = 0.05,
) -> list:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["sku_id", "date"]).reset_index(drop=True)

    if "unit_cost" not in df.columns or df["unit_cost"].isnull().all():
        df["unit_cost"] = df["price"] * 0.45
    else:
        df["unit_cost"] = df["unit_cost"].fillna(df["price"] * 0.45)

    if "transaction_count" not in df.columns or df["transaction_count"].isnull().all():
        df["transaction_count"] = np.maximum(1, np.round(df["observed_sales"] * 0.75)).astype(int)

    df["revenue"] = df["observed_sales"] * df["price"]
    df["gross_profit"] = df["revenue"] - (df["observed_sales"] * df["unit_cost"])
    df["margin_pct"] = np.where(df["revenue"] > 0, (df["gross_profit"] / df["revenue"]) * 100.0, 0.0)
    df["aov"] = np.where(df["transaction_count"] > 0, df["revenue"] / df["transaction_count"], 0.0)

    # Feature 4 calculation
    df["iso_forest_score"] = compute_isolation_forest_scores(df, contamination=contamination)

    peer_grouped = (
        df.groupby(["date", "category"])["observed_sales"]
        .agg(
            peer_median="median",
            peer_q25=lambda x: x.quantile(0.25),
            peer_q75=lambda x: x.quantile(0.75),
        )
        .reset_index()
    )
    peer_grouped["peer_iqr"] = np.maximum(
        peer_grouped["peer_q75"] - peer_grouped["peer_q25"], 1.0
    )
    df = pd.merge(df, peer_grouped, on=["date", "category"], how="left")

    results = []

    for sku_id, group in df.groupby("sku_id"):
        g = group.copy().sort_values("date").set_index("date")
        sales = g["observed_sales"].astype(float)

        rolling_median = sales.rolling(window=window, min_periods=1, center=True).median()
        rolling_median = rolling_median.bfill().ffill().fillna(sales.median())

        abs_dev = (sales - rolling_median).abs()
        mad = abs_dev.rolling(window=window, min_periods=1, center=True).median() * 1.4826
        mad = mad.replace(0.0, np.nan).bfill().ffill().fillna(1.0)

        z_scores = 0.6745 * (sales - rolling_median) / mad
        residuals = sales - rolling_median

        upper_band = rolling_median + (threshold * mad / 0.6745)
        lower_band = np.maximum(0.0, rolling_median - (threshold * mad / 0.6745))

        peer_median = g["peer_median"]
        peer_iqr = g["peer_iqr"]
        peer_discrepancy = (sales - peer_median) / peer_iqr

        baseline_margin = g["margin_pct"].rolling(window=window, min_periods=1, center=True).median()
        baseline_margin = baseline_margin.bfill().ffill().fillna(g["margin_pct"].median())

        for dt, actual, b_line, ub, lb, res, z, p_med, p_score, margin, b_margin, rev, aov, iso_s in zip(
            g.index,
            sales,
            rolling_median,
            upper_band,
            lower_band,
            residuals,
            z_scores,
            peer_median,
            peer_discrepancy,
            g["margin_pct"],
            baseline_margin,
            g["revenue"],
            g["aov"],
            g["iso_forest_score"],
        ):
            temporal_shock = abs(float(z)) >= threshold
            peer_shock = abs(float(p_score)) >= peer_threshold
            margin_shock = float(margin) < min_margin_threshold or (float(b_margin) - float(margin) > 20.0)
            tree_anomaly = float(iso_s) >= 0.65

            is_anomaly = temporal_shock or peer_shock or margin_shock or tree_anomaly

            if margin_shock and float(z) > 0:
                anomaly_type = "DISCOUNT_MARGIN_COLLAPSE"
            elif temporal_shock and peer_shock:
                anomaly_type = "ISOLATED_ENTITY_SHOCK"
            elif temporal_shock and not peer_shock:
                anomaly_type = "CATEGORY_WIDE_TREND"
            elif peer_shock:
                anomaly_type = "PEER_DIVERGENCE"
            elif tree_anomaly and not temporal_shock:
                anomaly_type = "MULTI_DIMENSIONAL_OUTLIER"
            else:
                anomaly_type = "NORMAL"

            severity = "NORMAL"
            if abs(float(z)) >= threshold + 1.5 or anomaly_type == "DISCOUNT_MARGIN_COLLAPSE":
                severity = "CRITICAL"
            elif abs(float(z)) >= threshold + 0.7 or margin_shock or float(iso_s) >= 0.75:
                severity = "HIGH"
            elif is_anomaly:
                severity = "MODERATE"

            # Feature 5: Retrieve human-in-the-loop acknowledgement status
            date_str = dt.strftime("%Y-%m-%d")
            feedback_key = f"{sku_id}_{date_str}"
            feedback_record = ACKNOWLEDGED_ANOMALIES.get(feedback_key, None)

            results.append({
                "date": date_str,
                "sku_id": sku_id,
                "category": g["category"].iloc[0],
                "observed_sales": round(float(actual), 2),
                "baseline": round(float(b_line), 2),
                "upper_bound": round(float(ub), 2),
                "lower_bound": round(float(lb), 2),
                "residual": round(float(res), 2),
                "z_score": round(float(z), 3),
                "peer_median": round(float(p_med), 2),
                "peer_discrepancy_score": round(float(p_score), 2),
                "revenue": round(float(rev), 2),
                "margin_pct": round(float(margin), 1),
                "aov": round(float(aov), 2),
                "isolation_score": round(float(iso_s), 3),
                "anomaly_type": anomaly_type,
                "severity": severity,
                "direction": "SPIKE" if float(z) > 0 else "DROP" if is_anomaly else "NORMAL",
                "is_anomaly": bool(is_anomaly),
                # Feature 5 Fields
                "feedback_status": feedback_record["feedback_status"] if feedback_record else "UNREVIEWED",
                "feedback_notes": feedback_record["notes"] if feedback_record else "",
            })

    return results


# ---------------------------------------------------------
# Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/forecast")
def run_forecast_endpoint(payload: ForecastRequest):
    try:
        if not payload.history:
            return {"status": "success", "data": []}

        df = pd.DataFrame([r.model_dump() for r in payload.history])
        data = generate_forecast_pipeline(df, payload.horizon_days)
        return {"status": "success", "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {exc}") from exc


@app.post("/api/anomalies")
def run_anomalies_endpoint(payload: AnomalyDetectionRequest):
    try:
        if not payload.history:
            return {
                "status": "success",
                "metadata": {
                    "window_days": payload.window_days,
                    "threshold_sigma": payload.threshold_sigma,
                    "peer_threshold_ratio": payload.peer_threshold_ratio,
                    "min_margin_pct_threshold": payload.min_margin_pct_threshold,
                    "contamination_rate": payload.contamination_rate,
                    "total_points": 0,
                    "anomalies_count": 0,
                    "margin_collapses": 0,
                    "isolated_shocks": 0,
                    "category_surges": 0,
                },
                "timeline": [],
                "anomalies": [],
            }

        df = pd.DataFrame([r.model_dump() for r in payload.history])
        records = detect_hybrid_anomalies(
            df,
            window=payload.window_days,
            threshold=payload.threshold_sigma,
            peer_threshold=payload.peer_threshold_ratio,
            min_margin_threshold=payload.min_margin_pct_threshold,
            contamination=payload.contamination_rate,
        )

        anomalies_only = [r for r in records if r["is_anomaly"]]

        return {
            "status": "success",
            "metadata": {
                "window_days": payload.window_days,
                "threshold_sigma": payload.threshold_sigma,
                "peer_threshold_ratio": payload.peer_threshold_ratio,
                "min_margin_pct_threshold": payload.min_margin_pct_threshold,
                "contamination_rate": payload.contamination_rate,
                "total_points": len(records),
                "anomalies_count": len(anomalies_only),
                "margin_collapses": len(
                    [r for r in anomalies_only if r["anomaly_type"] == "DISCOUNT_MARGIN_COLLAPSE"]
                ),
                "isolated_shocks": len(
                    [r for r in anomalies_only if r["anomaly_type"] == "ISOLATED_ENTITY_SHOCK"]
                ),
                "category_surges": len(
                    [r for r in anomalies_only if r["anomaly_type"] == "CATEGORY_WIDE_TREND"]
                ),
            },
            "timeline": records,
            "anomalies": anomalies_only,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {exc}") from exc


# Feature 5: Feedback API endpoint
@app.post("/api/anomalies/feedback")
def submit_anomaly_feedback(payload: AnomalyFeedbackRequest):
    try:
        feedback_key = f"{payload.sku_id}_{payload.date}"
        ACKNOWLEDGED_ANOMALIES[feedback_key] = {
            "feedback_status": payload.feedback_status,
            "notes": payload.notes,
            "timestamp": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        return {
            "status": "success",
            "message": f"Feedback updated for {payload.sku_id} on {payload.date}",
            "record": ACKNOWLEDGED_ANOMALIES[feedback_key],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)