import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, User, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdating(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <RefreshCw className="animate-spin text-primary mb-4" size={32} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando usuários...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-accent flex items-center gap-3">
              <Shield className="text-primary" /> Gestão de Acesso
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">Controle quem pode visualizar ou gerenciar os dados</p>
          </div>
          <button onClick={fetchUsers} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={20} className="text-accent" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível de Acesso</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center font-bold">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-accent">{user.email}</span>
                        <span className="text-[10px] text-gray-400">Cadastrado em {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                      user.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' :
                      user.role === 'GESTOR' ? 'bg-primary/10 text-primary border-primary/20' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {['USUARIO', 'GESTOR', 'ADMIN'].map((role) => (
                        <button
                          key={role}
                          disabled={updating === user.id || user.role === role}
                          onClick={() => updateRole(user.id, role)}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black transition-all ${
                            user.role === role 
                              ? 'bg-accent text-white' 
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {updating === user.id && user.role === role ? '...' : role}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;