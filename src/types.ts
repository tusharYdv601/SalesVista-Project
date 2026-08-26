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
