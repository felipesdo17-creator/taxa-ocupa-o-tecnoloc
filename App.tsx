import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import FileUpload from './components/FileUpload';
import EquipmentTable from './components/EquipmentTable';
import OccupancyDashboard from './components/OccupancyDashboard';
import UserManagement from './components/UserManagement';
import ChatAssistant from './components/ChatAssistant';
import InstallAppButton from './components/InstallAppButton';
import { Equipment } from './types';
import { RefreshCw, UserCircle, AlertTriangle, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarCollapsed(window.innerWidth < 768);
    }
  }, []);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-accent flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CloudOff size={40} />
          </div>
          <h2 className="text-2xl font-black text-accent mb-4 tracking-tighter">
            Configuracao pendente
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            As chaves do Supabase nao foram detectadas no ambiente.
          </p>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 text-left">
            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
            <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
              Certifique-se de que as variaveis VITE_SUPABASE_URL e
              VITE_SUPABASE_ANON_KEY estao configuradas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) setUserProfile(data);
      else setUserProfile({ role: 'USUARIO' });
    } catch {
      setUserProfile({ role: 'USUARIO' });
    }
  };

  const fetchCloudData = async () => {
    if (!session || !supabase) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .limit(5000)
        .order('patrimonio', { ascending: true });

      if (error) throw error;

      console.log(`Dados carregados: ${data?.length} itens.`);
      setEquipmentData((data as Equipment[]) || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (session) fetchCloudData();
  }, [session]);

  const handleLogout = async () => {
    if (supabase) await (supabase.auth as any).signOut();
  };

  if (!session) return <Login onSuccess={() => {}} />;

  const role = userProfile?.role || 'USUARIO';
  const mainOffset = isSidebarCollapsed ? 'ml-20' : 'ml-64';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-accent">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={role}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className={`transition-all duration-500 ease-in-out ${mainOffset}`}>
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur-xl md:flex md:items-center md:justify-between md:bg-white md:px-12 md:py-6">
          <div className="md:flex-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic">
              {activeTab === 'dashboard'
                ? 'Ocupacao'
                : activeTab === 'equipments'
                  ? 'Frota'
                  : activeTab === 'upload'
                    ? 'Importacao'
                    : 'Gestao'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Perfil: {role} • {equipmentData.length} ativos
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 md:mt-0 md:gap-4">
            <div className="hidden sm:block">
              <InstallAppButton />
            </div>
            <button
              onClick={fetchCloudData}
              className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 shadow-sm transition-all active:scale-95 hover:text-primary"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-right">
                <p className="max-w-[120px] truncate text-[10px] font-black text-accent">
                  {session.user.email}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-tighter text-primary">
                  Tecnoloc S/A
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-lg">
                <UserCircle size={28} />
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-3 py-6 md:px-10 md:py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <RefreshCw className="animate-spin text-primary opacity-20" size={64} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary">TL</span>
                </div>
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Sincronizando banco de dados...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <OccupancyDashboard data={equipmentData} />}
              {activeTab === 'equipments' && <EquipmentTable data={equipmentData} />}
              {activeTab === 'upload' && (role === 'GESTOR' || role === 'ADMIN') && (
                <FileUpload onDataLoaded={fetchCloudData} />
              )}
              {activeTab === 'users' && role === 'ADMIN' && (
                <UserManagement supabase={supabase} />
              )}
            </>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <ChatAssistant fleetData={equipmentData} />
      </div>
    </div>
  );
};

export default App;
