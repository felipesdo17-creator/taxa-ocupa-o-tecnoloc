import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Login from './components/Login';
import FileUpload from './components/FileUpload';
import EquipmentTable from './components/EquipmentTable';
import OccupancyDashboard from './components/OccupancyDashboard';
import UserManagement from './components/UserManagement';
import ChatAssistant from './components/ChatAssistant';
import { Equipment } from './types';
import { RefreshCw, UserCircle, AlertTriangle, CloudOff } from 'lucide-react';

// Inicialização segura do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Se o Supabase não estiver configurado, mostra tela de erro explicativa em vez de tela branca
  if (!supabase) {
    return (
      <div className="min-h-screen bg-accent flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CloudOff size={40} />
          </div>
          <h2 className="text-2xl font-black text-accent mb-4 tracking-tighter">Erro de Configuração</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            As chaves de conexão com o Banco de Dados (Supabase) não foram detectadas no ambiente. 
            <br/><br/>
            <span className="font-bold text-accent">Como resolver:</span> Verifique se as variáveis <code className="bg-gray-100 px-1 rounded">SUPABASE_URL</code> e <code className="bg-gray-100 px-1 rounded">SUPABASE_ANON_KEY</code> foram configuradas corretamente nas configurações do projeto.
          </p>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 text-left">
            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
            <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Atenção: Sem o banco de dados, o sistema de login e persistência não pode ser iniciado.</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (error) throw error;
      if (data) setUserProfile(data);
      else setUserProfile({ role: 'USUARIO' });
    } catch (e) {
      setUserProfile({ role: 'USUARIO' });
    }
  };

  const fetchCloudData = async () => {
    if (!session) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('equipments').select('*').order('patrimonio', { ascending: true });
      if (error) throw error;
      setEquipmentData(data as Equipment[] || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (session) fetchCloudData();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) return <Login onSuccess={() => {}} />;

  const role = userProfile?.role || 'USUARIO';

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-accent">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={role} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <main className={`flex-1 transition-all duration-500 ease-in-out pb-24 md:pb-8 ${
        isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <header className="sticky top-0 z-30 bg-[#F8F9FA]/80 backdrop-blur-xl px-6 md:px-10 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">
              {activeTab === 'dashboard' ? 'Ocupação' : 
               activeTab === 'equipments' ? 'Frota' : 
               activeTab === 'upload' ? 'Importação' : 'Gestão'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                Perfil: {role} • {equipmentData.length} ATIVOS
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchCloudData} 
              className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-primary transition-all active:scale-95"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
               <div className="text-right">
                 <p className="text-[10px] font-black text-accent truncate max-w-[120px]">{session.user.email}</p>
                 <p className="text-[8px] font-bold text-primary uppercase tracking-tighter">Tecnoloc S/A</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg">
                 <UserCircle size={28} />
               </div>
            </div>
          </div>
        </header>

        <section className="px-4 md:px-10 py-8 max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <RefreshCw className="animate-spin text-primary opacity-20" size={64} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary">TL</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-6">Conectando aos Sistemas...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <OccupancyDashboard data={equipmentData} />}
              {activeTab === 'equipments' && <EquipmentTable data={equipmentData} />}
              {activeTab === 'upload' && (role === 'GESTOR' || role === 'ADMIN') && (
                <FileUpload onDataLoaded={fetchCloudData} />
              )}
              {activeTab === 'users' && role === 'ADMIN' && <UserManagement />}
            </>
          )}
        </section>
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={role} />
      <ChatAssistant fleetData={equipmentData} />
    </div>
  );
};

export default App;