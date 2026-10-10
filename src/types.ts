import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  createdAt?: string;
}

// AI Sales Forecasting Data Interface
export interface ForecastDataPoint {
  date: string;
  sku_id: string;
  category: string;
  pred_p10: number; // Lower bound (Quantile 10)
  pred_p50: number; // Median Forecast (Quantile 50)
  pred_p90: number; // Upper bound (Quantile 90)
  elasticity?: number;
}

// Enterprise Store Record Schema
export interface StoreRecord {
  id: number;
  store_code: string;
  store_name: string;
  city: string | null;
  state: string | null;
  region: string | null;
  store_type: string | null;
  opening_date: string | null;
  manager_name: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Enriched Store Performance Metric with Aggregated Sales
export interface StorePerformanceMetric extends StoreRecord {
  total_sales: number;
  total_orders: number;
  avg_order_value: number;
  sales_share_pct: number;
  rank?: number;
}

// Enterprise Customer Record Schema
export interface CustomerRecord {
  id: number;
  customer_code: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  demographic_id: number | null;
  city: string | null;
  state: string | null;
  region: string | null;
  registration_date: string | null;
  customer_segment: string | null;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Enriched Customer Profile with Behavioral Analytics & RFM Metrics
export interface CustomerAnalyticsRecord extends CustomerRecord {
  total_spend: number;
  total_orders: number;
  avg_order_value: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
  recency_days: number | null;
  frequency: number;
  monetary: number;
  derived_segment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'New Customers' | 'At Risk' | 'Cannot Yet Classify';
  is_repeat: boolean;
  rank?: number;
}