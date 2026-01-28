import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import EquipmentTable from './components/EquipmentTable';
import OccupancyDashboard from './components/OccupancyDashboard';
import { Equipment } from './types';
import { Database, Filter, User, ShieldCheck, UserCircle } from 'lucide-react';

const STORAGE_KEY = 'equiprent_data_v1';
const ROLE_KEY = 'equiprent_user_role';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inicialização segura do papel do usuário
  const [userRole, setUserRole] = useState<'admin' | 'user'>(() => {
    try {
      const saved = localStorage.getItem(ROLE_KEY);
      return (saved === 'admin' || saved === 'user') ? saved : 'user';
    } catch {
      return 'user';
    }
  });

  useEffect(() => {
    // Carregamento inicial de dados
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          setEquipmentData(parsed);
        }
      }
    } catch (e) {
      console.error("Falha ao restaurar dados do localStorage:", e);
    } finally {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Persistência de preferências
  useEffect(() => {
    localStorage.setItem(ROLE_KEY, userRole);
  }, [userRole]);

  // Controle de acesso simplificado
  useEffect(() => {
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
      setActiveTab('dashboard');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <Database size={48} className="text-primary animate-bounce mb-4 opacity-50" />
            <div className="h-1.5 w-48 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
            </div>
            <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando Frota...</p>
          </div>
        </div>
      );
    }

    if (equipmentData.length === 0 && activeTab !== 'upload') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto min-h-[60vh]">
          <div className="bg-orange-50 p-8 rounded-full mb-6 text-primary shadow-inner">
            <Filter size={48} />
          </div>
          <h2 className="text-2xl font-black text-accent mb-4 tracking-tight">
            {userRole === 'admin' ? "Base de Dados Vazia" : "Aguardando Importação"}
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm font-medium">
            {userRole === 'admin' 
              ? "Olá Gestor! Carregue a planilha da frota (XLSX/CSV) para gerar os indicadores de ocupação da Tecnoloc." 
              : "O sistema está operacional, mas ainda não existem dados carregados pelo administrador da frota."}
          </p>
          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('upload')}
              className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all transform hover:-translate-y-1"
            >
              CARREGAR PLANILHA AGORA
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
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl max-w-2xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-accent mb-8 flex items-center gap-3">
               <ShieldCheck className="text-primary" /> Painel do Gestor
            </h2>
            <div className="space-y-8">
              <section>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Ações de Manutenção</h3>
                <div className="p-8 bg-red-50 rounded-3xl border border-red-100">
                  <h4 className="font-bold text-red-800 mb-2">Resetar Banco de Dados</h4>
                  <p className="text-xs text-red-600/80 mb-6 font-medium">Esta ação é irreversível e removerá todos os ativos cadastrados localmente.</p>
                  <button 
                    onClick={clearData}
                    className="px-8 py-3 bg-red-600 text-white text-[11px] font-black rounded-xl hover:bg-red-700 transition-all uppercase tracking-wider"
                  >
                    LIMPAR TODA A FROTA
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : null;
      default:
        return <OccupancyDashboard data={equipmentData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-primary/20">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col relative">
        <header className="sticky top-0 z-30 bg-[#F8F9FA]/80 backdrop-blur-xl px-10 py-8 flex items-center justify-between border-b border-gray-100/50">
          <div>
            <h1 className="text-3xl font-black text-accent tracking-tighter">
              {activeTab === 'dashboard' ? 'Taxa de Ocupação' : 
               activeTab === 'equipments' ? 'Gestão de Ativos' : 
               activeTab === 'upload' ? 'Importação' : 'Configurações'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                {equipmentData.length > 0 ? `${equipmentData.length} unidades monitoradas` : 'Sistema Ativo'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center bg-white border border-gray-100 rounded-[1.2rem] p-1.5 shadow-sm">
              <button 
                onClick={() => setUserRole('user')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${userRole === 'user' ? 'bg-accent text-white shadow-lg' : 'text-gray-400 hover:text-accent'}`}
              >
                <UserCircle size={14} /> CONSULTOR
              </button>
              <button 
                onClick={() => setUserRole('admin')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${userRole === 'admin' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-primary'}`}
              >
                <ShieldCheck size={14} /> GESTOR
              </button>
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
               <div className="text-right">
                 <p className="text-xs font-black text-accent">{userRole === 'admin' ? 'Gestor Master' : 'Visitante'}</p>
                 <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Tecnoloc S/A</p>
               </div>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${userRole === 'admin' ? 'bg-primary text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
                 <User size={24} />
               </div>
            </div>
          </div>
        </header>

        <section className="px-10 pb-20 flex-1 pt-10">
          {renderContent()}
        </section>
        
        <footer className="px-10 py-6 border-t border-gray-100/50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          <span>© 2025 TECNOLOC - Inteligência em Locação</span>
          <span>Versão 2.1.0 Stable</span>
        </footer>
      </main>
    </div>
  );
};

export default App;