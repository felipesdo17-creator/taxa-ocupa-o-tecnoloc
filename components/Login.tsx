import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, ArrowRight, CloudOff } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha na autenticacao');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-accent flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl text-center shadow-2xl">
          <CloudOff className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold">Erro de Conexao</h2>
          <p className="text-gray-500 text-sm mt-2">Supabase nao inicializado corretamente.</p>
        </div>
      </div>
    );
  }

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
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3">
            Sistemas de Frota v3.0
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Seu e-mail"
              required
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Sua senha"
              required
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase animate-shake">
              <CloudOff size={14} /> {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            variant="primary"
            size="lg"
            icon={!isLoading && <ArrowRight size={20} />}
            className="w-full"
          >
            Acessar Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
