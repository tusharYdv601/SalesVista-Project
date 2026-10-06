from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
import pandas as pd
from scipy.stats import norm
from sklearn.linear_model import LinearRegression
import lightgbm as lgb

app = FastAPI(title="SalesVista AI Forecasting Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow your Vite frontend (http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Contracts ---
class SalesRecord(BaseModel):
    date: str
    sku_id: str
    category: str
    observed_sales: float
    in_stock: int
    price: float
    promo_flag: int

class ForecastRequest(BaseModel):
    horizon_days: int = 30
    history: List[SalesRecord] = []

# --- Core Algorithm Engines ---
def correct_censored_demand(df: pd.DataFrame, window: int = 14) -> pd.DataFrame:
    df = df.sort_values(["sku_id", "date"]).copy()
    df["unconstrained_demand"] = df["observed_sales"]

    def impute_group(group):
        valid = group["observed_sales"].where(group["in_stock"] == 1, np.nan)
        mean_val = valid.rolling(window, min_periods=3).mean().bfill().ffill()
        std_val = valid.rolling(window, min_periods=3).std().bfill().ffill().fillna(1.0)
        
        censored = group["in_stock"] == 0
        mu = mean_val[censored]
        sigma = np.maximum(std_val[censored], 1e-3)
        alpha = -mu / sigma
        lambda_val = norm.pdf(alpha) / (1.0 - norm.cdf(alpha) + 1e-6)
        group.loc[censored, "unconstrained_demand"] = np.round(mu + sigma * lambda_val, 2)
        return group

    return df.groupby("sku_id", group_keys=False).apply(impute_group)

def generate_forecast_pipeline(df: pd.DataFrame, horizon_days: int):
    # Impute demand
    df = correct_censored_demand(df)
    df["date"] = pd.to_datetime(df["date"])
    
    results = []
    quantiles = [0.10, 0.50, 0.90]

    for sku_id, group in df.groupby("sku_id"):
        group = group.sort_values("date").reset_index(drop=True)
        category = group["category"].iloc[0]
        
        # Estimate elasticity
        log_price = np.log(np.maximum(group["price"].values, 1e-4)).reshape(-1, 1)
        log_y = np.log(np.maximum(group["unconstrained_demand"].values, 1e-3))
        lr = LinearRegression().fit(log_price, log_y)
        elasticity = min(lr.coef_[0], -0.05) # Enforce downward sloping law of demand
        
        # Features
        group["dow"] = group["date"].dt.dayofweek
        group["sin_dow"] = np.sin(2 * np.pi * group["dow"] / 7)
        group["cos_dow"] = np.cos(2 * np.pi * group["dow"] / 7)
        group["lag_7"] = group["unconstrained_demand"].shift(7).bfill()
        
        # Detrend price effect
        price_adj = np.exp(elasticity * log_price.flatten())
        y_adj = group["unconstrained_demand"].values / price_adj
        
        features = ["sin_dow", "cos_dow", "lag_7", "promo_flag"]
        
        models = {}
        for q in quantiles:
            m = lgb.LGBMRegressor(objective="quantile", alpha=q, n_estimators=60, learning_rate=0.08, verbose=-1, random_state=42)
            m.fit(group[features], y_adj)
            models[q] = m

        # Future Horizon Simulation
        last_date = group["date"].max()
        future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=horizon_days, freq="D")
        recent_sales = list(group["unconstrained_demand"].values[-14:])
        last_price = group["price"].iloc[-1]
        
        for f_date in future_dates:
            dow = f_date.dayofweek
            sin_dow = np.sin(2 * np.pi * dow / 7)
            cos_dow = np.cos(2 * np.pi * dow / 7)
            lag_7 = recent_sales[-7] if len(recent_sales) >= 7 else np.mean(recent_sales)
            promo = 1 if dow in [5, 6] else 0
            
            x_step = pd.DataFrame([[sin_dow, cos_dow, lag_7, promo]], columns=features)
            
            p_price = np.exp(elasticity * np.log(max(last_price, 1e-4)))
            p10 = max(0.0, float(models[0.10].predict(x_step)[0] * p_price))
            p50 = max(0.0, float(models[0.50].predict(x_step)[0] * p_price))
            p90 = max(0.0, float(models[0.90].predict(x_step)[0] * p_price))
            
            recent_sales.append(p50)
            
            results.append({
                "date": f_date.strftime("%Y-%m-%d"),
                "sku_id": sku_id,
                "category": category,
                "pred_p10": round(p10, 2),
                "pred_p50": round(p50, 2),
                "pred_p90": round(p90, 2),
                "elasticity": round(float(elasticity), 3)
            })

    return results

@app.post("/api/forecast")
def run_forecast_endpoint(payload: ForecastRequest):
    if not payload.history:
        # Generate dynamic realistic demo data if no records are supplied
        dates = pd.date_range(end=pd.Timestamp.now(), periods=120, freq="D")
        mock_data = []
        for sku, cat, base in [("SKU-001", "Apparel", 85), ("SKU-002", "Electronics", 45), ("SKU-003", "Footwear", 60)]:
            for d in dates:
                stock = 0 if np.random.rand() < 0.08 else 1
                mock_data.append({
                    "date": d.strftime("%Y-%m-%d"),
                    "sku_id": sku,
                    "category": cat,
                    "observed_sales": float(np.random.poisson(base * (1.3 if d.dayofweek in [5,6] else 1.0))) if stock else 0.0,
                    "in_stock": stock,
                    "price": 49.99 if sku == "SKU-001" else 199.99,
                    "promo_flag": 1 if d.dayofweek == 6 else 0
                })
        df = pd.DataFrame(mock_data)
    else:
        df = pd.DataFrame([r.dict() for r in payload.history])

    forecasts = generate_forecast_pipeline(df, payload.horizon_days)
    return {"status": "success", "data": forecasts}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)