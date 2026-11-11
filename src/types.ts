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
  pred_p10: number;
  pred_p50: number;
  pred_p90: number;
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

export interface StorePerformanceMetric extends StoreRecord {
  total_sales: number;
  total_orders: number;
  avg_order_value: number;
  sales_share_pct: number;
  rank?: number;
}

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

// --- Reports & Analysis Interfaces ---
export interface ExecutiveMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
}

export interface ExecutiveTakeaway {
  id: string;
  type: 'growth' | 'risk' | 'milestone' | 'neutral';
  title: string;
  detail: string;
  badgeText: string;
}

export interface VarianceDataPoint {
  period: string;
  target: number;
  actual: number;
  variancePct: number;
}

export interface StorePerformanceRanking {
  storeId: string;
  storeName: string;
  region: string;
  revenue: string;
  targetAchievementPct: number;
  status: 'Exceeded' | 'On Track' | 'Underperforming';
}

export interface AnomalyAuditItem {
  id: string;
  date: string;
  storeName: string;
  metric: string;
  deviation: string;
  suspectedCause: string;
  status: 'Investigating' | 'Resolved' | 'Action Needed';
}

export interface CrossDimensionCell {
  region: string;
  segment: string;
  revenue: number;
  orders: number;
  health: 'high' | 'medium' | 'low';
}