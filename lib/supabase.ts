import { createClient, SupabaseClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env. Para evitar erros de tipagem, fazemos o cast para any.
const env = (import.meta as any).env || process.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Instância única do Supabase para toda a aplicação.
 * Isso evita o erro: "Multiple GoTrueClient instances detected".
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
