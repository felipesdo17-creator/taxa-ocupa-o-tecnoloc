import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Função para buscar variáveis de ambiente de múltiplas fontes possíveis
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key])
    return process.env[key] as string;
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) return metaEnv[key] as string;
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

/**
 * Instância única do Supabase para toda a aplicação.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn(
    'Supabase: Credenciais não encontradas ou inválidas. Verifique as variáveis de ambiente.'
  );
}
