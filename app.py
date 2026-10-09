"""SalesVista AI forecasting service.

Run:  python app.py   (or: uvicorn app:app --reload --port 8000)
"""
import os
from functools import lru_cache
from typing import List

import lightgbm as lgb
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy.stats import norm
from sklearn.linear_model import LinearRegression

QUANTILES = (0.10, 0.50, 0.90)
MIN_HISTORY_DAYS = 3  # fewest observations per SKU needed to fit the models
DEMO_SKUS = (("SKU-001", "Apparel", 85, 49.99), ("SKU-002", "Electronics", 45, 199.99), ("SKU-003", "Footwear", 60, 199.99))

app = FastAPI(title="SalesVista AI Forecasting Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class SalesRecord(BaseModel):
    date: str
    sku_id: str
    category: str
    observed_sales: float
    in_stock: int
    price: float
    promo_flag: int


class ForecastRequest(BaseModel):
    horizon_days: int = Field(30, ge=1, le=365)
    history: List[SalesRecord] = []


def _dow_features(dow):
    angle = 2 * np.pi * dow / 7
    return np.sin(angle), np.cos(angle)


def correct_censored_demand(df: pd.DataFrame, window: int = 14) -> pd.DataFrame:
    """Impute unconstrained demand on out-of-stock days (truncated-normal mean)."""
    df = df.sort_values(["sku_id", "date"]).reset_index(drop=True)
    df["unconstrained_demand"] = df["observed_sales"].astype(float)

    for _, g in df.groupby("sku_id"):
        valid = g["observed_sales"].where(g["in_stock"] == 1)
        # Fall back to 0 / 1 when a SKU has no in-stock days to learn from.
        mean = valid.rolling(window, min_periods=MIN_HISTORY_DAYS).mean().bfill().ffill().fillna(0.0)
        std = valid.rolling(window, min_periods=MIN_HISTORY_DAYS).std().bfill().ffill().fillna(1.0)

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

    # Price elasticity (log-log), constrained to a downward-sloping demand curve.
    log_price = np.log(np.maximum(group["price"].to_numpy(), 1e-4)).reshape(-1, 1)
    lr = LinearRegression().fit(log_price, np.log(np.maximum(demand, 1e-3)))
    elasticity = min(float(lr.coef_[0]), -0.05)

    # Feature order [sin_dow, cos_dow, lag_7, promo_flag] must match the forecast loop below.
    sin_dow, cos_dow = _dow_features(group["date"].dt.dayofweek.to_numpy())
    train = np.column_stack([
        sin_dow, cos_dow,
        pd.Series(demand).shift(7).bfill().to_numpy(),
        group["promo_flag"].to_numpy(),
    ])
    y_adj = demand / np.exp(elasticity * log_price.ravel())  # remove price effect

    models = [
        lgb.LGBMRegressor(
            objective="quantile", alpha=q, n_estimators=60, learning_rate=0.08,
            verbose=-1, random_state=42, n_jobs=1,  # tiny data: threading only adds overhead
        ).fit(train, y_adj)
        for q in QUANTILES
    ]

    price_factor = float(np.exp(elasticity * log_price[-1, 0]))
    future = pd.date_range(group["date"].max() + pd.Timedelta(days=1), periods=horizon_days, freq="D")
    sin_f, cos_f = _dow_features(future.dayofweek.to_numpy())
    is_weekend = (future.dayofweek >= 5).astype(int)
    model_p10, model_p50, model_p90 = models

    # lag_7 depends on earlier medians, so only the p50 model runs step by step;
    # the p10/p90 models are then evaluated once on the full feature matrix.
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


def demo_history(day: str) -> pd.DataFrame:
    """Reproducible demo data ending on the given calendar day."""
    rng = np.random.default_rng(42)
    dates = pd.date_range(end=pd.Timestamp(day), periods=120, freq="D")
    weekend = dates.dayofweek >= 5
    frames = []
    for sku, cat, base, price in DEMO_SKUS:
        in_stock = (rng.random(len(dates)) >= 0.08).astype(int)
        sales = rng.poisson(base * np.where(weekend, 1.3, 1.0)).astype(float) * in_stock
        frames.append(pd.DataFrame({
            "date": dates.strftime("%Y-%m-%d"), "sku_id": sku, "category": cat,
            "observed_sales": sales, "in_stock": in_stock, "price": price,
            "promo_flag": (dates.dayofweek == 6).astype(int),
        }))
    return pd.concat(frames, ignore_index=True)


@lru_cache(maxsize=32)
def demo_forecast(day: str, horizon_days: int) -> list:
    """Demo forecasts are deterministic per (day, horizon), so train once and reuse."""
    return generate_forecast_pipeline(demo_history(day), horizon_days)


def validate_history(df: pd.DataFrame) -> None:
    short = df.groupby("sku_id").size().loc[lambda n: n < MIN_HISTORY_DAYS]
    if not short.empty:
        raise HTTPException(
            status_code=422,
            detail=f"Need at least {MIN_HISTORY_DAYS} days of history per SKU; too short: {', '.join(short.index)}",
        )


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/forecast")
def run_forecast_endpoint(payload: ForecastRequest):
    try:
        if payload.history:
            df = pd.DataFrame([r.model_dump() for r in payload.history])
            validate_history(df)
            data = generate_forecast_pipeline(df, payload.horizon_days)
        else:
            data = demo_forecast(pd.Timestamp.now().strftime("%Y-%m-%d"), payload.horizon_days)
        return {"status": "success", "data": data}
    except HTTPException:
        raise
    except Exception as exc:  # surface model failures as a clean API error
        raise HTTPException(status_code=500, detail=f"Forecast failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
