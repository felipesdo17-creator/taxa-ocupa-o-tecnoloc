
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, CloudOff } from 'lucide-react';

// Inicialização compatível com Vite (import.meta.env) e fallbacks
// Fix: Cast import.meta to any to bypass environment-specific property access error
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL || '';
// Fix: Cast import.meta to any to bypass environment-specific property access error
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Fix: Access auth methods via any cast to resolve property missing errors on SupabaseAuthClient
        const { error } = await (supabase.auth as any).signUp({ email, password });
        if (error) throw error;
        alert("Conta criada! O Administrador irá definir seu nível de acesso.");
      } else {
        // Fix: Access auth methods via any cast to resolve property missing errors on SupabaseAuthClient
        const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supabase) return null;

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 p-10 md:p-12 border border-white/20">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl shadow-primary/40">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-black text-accent tracking-tighter italic">TECNOLOC</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3">Sistemas de Frota v3.0</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Seu E-mail"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-primary/20 focus:bg-white outline-none transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Sua Senha"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-primary/20 focus:bg-white outline-none transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase animate-shake">
              <CloudOff size={14} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-accent text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isSignUp ? 'Criar Nova Conta' : 'Acessar Dashboard'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors py-2"
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastrar Acesso'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
