import React from 'react';
import {
  BarChart3,
  Package,
  Upload,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  onLogout,
  isCollapsed,
  setIsCollapsed,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['USUARIO', 'GESTOR', 'ADMIN'] },
    {
      id: 'equipments',
      label: 'Equipamentos',
      icon: Package,
      roles: ['USUARIO', 'GESTOR', 'ADMIN'],
    },
    { id: 'upload', label: 'Importar Dados', icon: Upload, roles: ['GESTOR', 'ADMIN'] },
    { id: 'users', label: 'Gestão de Acesso', icon: Users, roles: ['ADMIN'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`hidden md:flex flex-col bg-accent text-white h-screen fixed left-0 top-0 z-40 transition-all duration-500 ease-in-out border-r border-white/5 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6 flex items-center justify-between border-b border-white/5 h-24">
        {!isCollapsed ? (
          <div className="flex flex-col animate-in fade-in duration-500">
            <span className="font-black text-2xl italic tracking-tighter text-primary">
              TECNOLOC
            </span>
            <span className="text-[8px] font-bold uppercase text-gray-400 tracking-[0.2em]">
              Frota Inteligente
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="font-black text-xl italic text-primary">T</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-8 px-3 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${
                isActive
                  ? 'bg-primary text-white shadow-xl shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon
                size={22}
                className={isActive ? 'text-white' : 'group-hover:text-primary transition-colors'}
              />
              {!isCollapsed && (
                <span className="font-bold text-xs truncate animate-in slide-in-from-left-2 uppercase tracking-wider">
                  {item.label}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute right-0 w-1.5 h-8 bg-primary rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-white/5">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-widest">Recolher Menu</span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all group"
        >
          <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
          {!isCollapsed && <span className="font-bold text-xs uppercase tracking-wider">Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
