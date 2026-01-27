
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import EquipmentTable from './components/EquipmentTable';
import OccupancyDashboard from './components/OccupancyDashboard';
import { Equipment } from './types';
import { Database, Filter, Bell, User, ShieldCheck, UserCircle } from 'lucide-react';

const STORAGE_KEY = 'equiprent_data_v1';
const ROLE_KEY = 'equiprent_user_role';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>(() => {
    return (localStorage.getItem(ROLE_KEY) as 'admin' | 'user') || 'user';
  });

  // Load persisted data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setEquipmentData(JSON.parse(savedData));
      } catch (e) {
        console.error("Error parsing stored data", e);
      }
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Persist role changes
  useEffect(() => {
    localStorage.setItem(ROLE_KEY, userRole);
    // If user is not admin and is on upload tab, redirect them
    if (userRole === 'user' && (activeTab === 'upload' || activeTab === 'admin')) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  const handleDataLoaded = (data: Equipment[]) => {
    setEquipmentData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setActiveTab('dashboard');
  };

  const clearData = () => {
    if (window.confirm("Deseja realmente apagar todos os dados importados?")) {
      setEquipmentData([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <Database size={48} className="text-primary mb-4 opacity-20" />
            <div className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      );
    }

    if (equipmentData.length === 0 && activeTab !== 'upload') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto">
          <div className="bg-orange-50 p-6 rounded-full mb-6 text-secondary">
            {userRole === 'admin' ? <Filter size={48} /> : <Database size={48} />}
          </div>
          <h2 className="text-2xl font-bold text-accent mb-4">
            {userRole === 'admin' ? "Nenhum dado importado" : "Aguardando Dados"}
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {userRole === 'admin' 
              ? "Como administrador, você precisa carregar uma planilha de frota para que os usuários possam visualizar as análises." 
              : "O administrador ainda não importou os dados da frota. Por favor, retorne mais tarde para visualizar as análises de ocupação."}
          </p>
          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('upload')}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            >
              Carregar Dados Agora
            </button>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <OccupancyDashboard data={equipmentData} />;
      case 'equipments':
        return <EquipmentTable data={equipmentData} />;
      case 'upload':
        return userRole === 'admin' ? <FileUpload onDataLoaded={handleDataLoaded} /> : null;
      case 'admin':
        return userRole === 'admin' ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
            <h2 className="text-2xl font-bold text-accent mb-6">Painel de Controle</h2>
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Gerenciamento de Dados</h3>
                <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-sm text-red-600 mb-4 font-medium">Zona de perigo: Apagar todos os dados persistentes no sistema.</p>
                  <button 
                    onClick={clearData}
                    className="px-6 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Resetar Banco de Dados Local
                  </button>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Regras de Negócio Ativas</h3>
                <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-accent">Cálculo de TO</span>
                    <span className="text-gray-500">Locados / Total da Unidade</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-accent">Persistência</span>
                    <span className="text-green-600 font-bold">LocalStorage Habilitado</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col bg-[#F8F9FA]">
        <header className="sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-md px-10 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-accent tracking-tight">
              {activeTab === 'dashboard' ? 'Análise de Ocupação' : 
               activeTab === 'equipments' ? 'Gestão de Ativos' : 
               activeTab === 'upload' ? 'Importação de Dados' : 'Configurações'}
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-1">
              {equipmentData.length > 0 ? `${equipmentData.length} ativos em monitoramento` : 'Sistema pronto para análise'}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
              <button 
                onClick={() => setUserRole('user')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${userRole === 'user' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:text-accent'}`}
              >
                <UserCircle size={14} /> Usuário
              </button>
              <button 
                onClick={() => setUserRole('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${userRole === 'admin' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary'}`}
              >
                <ShieldCheck size={14} /> Admin
              </button>
            </div>

            <div className="flex items-center gap-3">
               <button className="p-2.5 text-gray-400 hover:text-accent bg-white rounded-xl shadow-sm border border-gray-100 transition-all">
                 <Bell size={20} />
               </button>
               <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-accent">{userRole === 'admin' ? 'Gestor de Frota' : 'Visualizador'}</p>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {userRole === 'admin' ? 'Acesso Total' : 'Acesso Limitado'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <User size={24} />
                  </div>
               </div>
            </div>
          </div>
        </header>

        <section className="px-10 pb-12 flex-1 mt-8">
          {renderContent()}
        </section>
      </main>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
