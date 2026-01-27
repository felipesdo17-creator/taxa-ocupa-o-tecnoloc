
import React from 'react';
import { BarChart3, Package, Upload, Settings, Database, Share2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const navItems = [
    { id: 'dashboard', label: 'Taxa de Ocupação', icon: BarChart3, roles: ['admin', 'user'] },
    { id: 'equipments', label: 'Equipamentos', icon: Package, roles: ['admin', 'user'] },
    { id: 'upload', label: 'Upload de Dados', icon: Upload, roles: ['admin'] },
    { id: 'admin', label: 'Configurações', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-accent text-white flex flex-col h-screen fixed left-0 top-0 z-20 transition-all duration-300">
      <div className="p-8 flex items-center gap-3 border-b border-white/5">
        <div className="bg-white rounded-xl p-2 shadow-lg flex items-center justify-center">
          {/* Simulated logo based on the provided image */}
          <div className="relative w-8 h-8">
             <div className="absolute inset-0 border-[3px] border-primary rounded-full border-t-transparent border-l-transparent rotate-45"></div>
             <div className="absolute inset-1 border-[3px] border-secondary rounded-full border-b-transparent border-r-transparent -rotate-45"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
             </div>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-xl tracking-tighter leading-none italic text-white">TECNOLOC</span>
          <span className="text-[7px] font-bold uppercase tracking-tight text-secondary-light">Locação de equipamentos</span>
        </div>
      </div>
      
      <nav className="flex-1 py-8 px-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-secondary' : 'group-hover:text-primary-light transition-colors'} />
              <span className="font-bold text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-2">Ambiente Ativo</p>
          <p className={`text-[10px] font-black ${userRole === 'admin' ? 'text-secondary' : 'text-primary-light'}`}>
            {userRole === 'admin' ? 'ACESSO MASTER' : 'CONSULTOR'}
          </p>
        </div>
      </div>
      
      <div className="p-6 text-[9px] font-bold text-gray-600 text-center border-t border-white/5">
        TECNOLOC © 2025
      </div>
    </aside>
  );
};

export default Sidebar;
