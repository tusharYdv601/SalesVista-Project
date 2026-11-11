<div align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-AI_Service-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/LightGBM-Forecasting-FF6F00?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />

# 🛒 SalesVista

### Enterprise Sales Analysis & AI Analytics Platform

A full-stack, multi-tenant sales intelligence dashboard built for retail businesses. SalesVista combines **real-time Supabase analytics**, **AI-powered sales forecasting** (LightGBM), and **anomaly detection** (Isolation Forest + Modified Z-Score) — with strict per-tenant data isolation so every user sees only their own data.

> **B.Tech CSE Project** — built with React 19, TypeScript, Supabase, FastAPI, TailwindCSS 4, and Python ML.

</div>

---

## ✨ Features

### 📊 Core Analytics

| Module | Description |
|--------|-------------|
| **Main Dashboard** | Executive KPI overview — Total Sales, Orders, Avg Order Value, Customers across date ranges |
| **Store Analysis** | Store-wise performance comparison, regional revenue charts, format breakdown |
| **Customer Insights** | RFM-based customer profiles, purchase history, repeat rate, AOV per customer |
| **Demographic Segmentation** | Age bracket, income tier, regional cluster analytics with cohort directory |
| **Customer Segmentation (ML)** | K-Means + RFM clustering into 5 live segments: Champions, Frequent Buyers, Occasional, At-Risk, Prospects |

### 🤖 AI Modules

| Module | Model | Description |
|--------|-------|-------------|
| **Sales Forecasting** | LightGBM + Quantile Regression | 10–90 day demand forecasts with P10/P50/P90 confidence bands and price elasticity |
| **Anomaly Detection** | Isolation Forest + Modified Z-Score | Detects revenue spikes, margin drops, discount collapses, and peer discrepancies |

### 🔐 Multi-Tenant Security
- All Supabase queries are scoped with `.eq('owner_id', user.id)` — no data leaks between accounts
- Zero hardcoded fallbacks — empty accounts see clean empty states, never another user's data
- Row-Level Security (RLS) enforced at the database layer

### 🗂️ Data Management
- **CSV Import Wizard** — 5-step guided import: Stores → Products → Customers → Transactions → Sales Items
- **Data Edit View** — Full CRUD with multi-select, bulk delete, inline edit, and pagination
- **CSV Export** — Export demographic cohorts and filtered views

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript 5.8** + **Vite 6**
- **TailwindCSS 4** for styling
- **Recharts** for data visualization (bar, pie, line, area charts)
- **React Router 7** for navigation
- **Lucide React** for icons
- **PapaParse** for CSV parsing

### Backend (AI Service)
- **FastAPI** REST API
- **LightGBM** — gradient-boosted quantile regression for sales forecasting
- **Scikit-learn** — Isolation Forest for anomaly detection
- **NumPy / Pandas / SciPy** — data processing and statistical analysis

### Infrastructure
- **Supabase** — PostgreSQL database, authentication, and Row-Level Security
- **Uvicorn** — ASGI server for FastAPI

---

## 📁 Project Structure

```
SalesVista-Project/
├── app.py                          # FastAPI AI service (forecasting + anomaly detection)
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
│
├── src/
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   └── salesHistoryLoader.ts   # Multi-tenant sales data ingestion pipeline
│   │
│   ├── context/
│   │   └── AuthContext.tsx         # Auth state management
│   │
│   ├── components/
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── KpiCard.tsx             # Reusable KPI metric card
│   │   ├── AnalysisCard.tsx        # Quick analysis card
│   │   └── ...
│   │
│   └── pages/dashboard/
│       ├── MainView.tsx            # Executive dashboard + KPI overview
│       ├── StoresView.tsx          # Store performance analytics
│       ├── CustomersView.tsx       # Customer insights + RFM analytics
│       ├── DemographicsView.tsx    # Demographic segmentation suite
│       ├── SegmentationView.tsx    # ML customer segmentation (RFM + K-Means)
│       ├── ForecastingView.tsx     # AI sales forecasting (LightGBM)
│       ├── AnomaliesView.tsx       # AI anomaly detection
│       ├── DataImportView.tsx      # CSV import wizard
│       └── DataEditView.tsx        # Full CRUD data editor
│
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- A **Supabase** project

### 1. Clone the Repository

```bash
git clone https://github.com/tusharYdv601/SalesVista-Project.git
cd SalesVista-Project
git checkout tushar   # or main
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://127.0.0.1:8000
```

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Set Up Python Backend

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Run the Project

**Terminal 1 — Python AI Service:**
```bash
python app.py
# Running on http://127.0.0.1:8000
```

**Terminal 2 — React Frontend:**
```bash
npm run dev
# Running on http://localhost:3000
```

---

## 🗄️ Supabase Database Schema

All tables must include an `owner_id UUID` column mapped to `auth.uid()` for Row-Level Security.

| Table | Key Columns |
|-------|------------|
| `stores` | `store_code`, `store_name`, `city`, `state`, `region`, `store_type` |
| `product_categories` | `category_name`, `description` |
| `products` | `product_code`, `product_name`, `category_id`, `unit_price`, `cost_price` |
| `demographics` | `age_group`, `gender`, `income_group`, `education_level`, `occupation` |
| `customers` | `customer_code`, `full_name`, `email`, `date_of_birth`, `gender`, `demographic_id`, `region` |
| `sales_transactions` | `transaction_date`, `customer_id`, `store_id`, `total_amount`, `sales_channel` |
| `sales_items` | `transaction_id`, `product_id`, `quantity`, `unit_price`, `discount_amount` |

> Enable RLS on all tables with the policy: `owner_id = auth.uid()`

---

## 🔌 API Reference

The FastAPI backend runs on `http://127.0.0.1:8000`.

### `GET /api/health`
```json
{ "status": "ok" }
```

### `POST /api/forecast`
Run AI sales forecast using LightGBM quantile regression.

**Request body:**
```json
{
  "horizon_days": 30,
  "history": [
    {
      "date": "2024-01-15",
      "sku_id": "PROD-001",
      "category": "Apparel",
      "observed_sales": 120.0,
      "in_stock": 1,
      "price": 599.0,
      "promo_flag": 0
    }
  ]
}
```

**Response:**
```json
{
  "data": [
    {
      "date": "2024-02-01",
      "sku_id": "PROD-001",
      "category": "Apparel",
      "pred_p10": 95.0,
      "pred_p50": 125.0,
      "pred_p90": 160.0,
      "elasticity": -1.25
    }
  ]
}
```

### `POST /api/anomalies`
Detect sales anomalies using Isolation Forest + Modified Z-Score.

**Request body:**
```json
{
  "window_days": 7,
  "threshold_sigma": 2.5,
  "peer_threshold_ratio": 2.0,
  "min_margin_pct_threshold": 0.05,
  "history": [...]
}
```

---

## 🌿 Branches

| Branch | Owner | Description |
|--------|-------|-------------|
| `main` | — | Stable merged production branch |
| `tushar` | Tushar | Core dashboard, AI modules, data isolation |
| `vansh` | Vansh | UI contributions and features |
| `suryaSegementation` | Surya | Customer segmentation module |

**To contribute:**
```bash
git checkout -b your-feature-branch
git add -A
git commit -m "feat: your feature"
git push origin your-feature-branch
# Open a Pull Request into main
```

---

## 📄 License

This project is built for academic purposes as a B.Tech CSE final-year project.

---

<div align="center">
Made with ❤️ by <strong>Tushar, Vansh & Surya</strong>
</div>
