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