import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
};

/**
 * P3-3: Paginação e limites defensivos para consultas Supabase
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export function getPaginationRange(page = 1, pageSize = DEFAULT_PAGE_SIZE): { from: number; to: number } {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize));
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;
  return { from, to };
}
