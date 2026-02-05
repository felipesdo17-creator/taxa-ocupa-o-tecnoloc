import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Shield, RefreshCw } from 'lucide-react';
import { Profile, UserRole } from '../types';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface UserManagementProps {
  supabase: SupabaseClient;
}

const ROLE_OPTIONS: UserRole[] = ['USUARIO', 'GESTOR', 'ADMIN'];

const UserManagement: React.FC<UserManagementProps> = ({ supabase }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setUsers(data as Profile[]);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);

    if (!error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
    setUpdating(null);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    const variants: Record<UserRole, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      USUARIO: 'info',
      GESTOR: 'warning',
      ADMIN: 'danger',
    };
    return variants[role];
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="animate-spin text-primary mb-4" size={32} />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Sincronizando permissões...
        </p>
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
            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
              Configure os níveis de segurança da Tecnoloc
            </p>
          </div>
          <Button
            onClick={fetchUsers}
            variant="secondary"
            size="md"
            icon={<RefreshCw size={18} />}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Usuário
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Nível de Acesso
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                  Ações
                </th>
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
                        <span className="text-[10px] text-gray-400">
                          Desde {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <Badge variant={getRoleBadgeVariant(user.role)} size="md">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {ROLE_OPTIONS.map((role) => (
                        <Button
                          key={role}
                          disabled={updating === user.id || user.role === role}
                          onClick={() => updateRole(user.id, role)}
                          variant={user.role === role ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {updating === user.id && user.role === role ? '...' : role}
                        </Button>
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
