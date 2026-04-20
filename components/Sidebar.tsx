import React from 'react';
import {
  BarChart3,
  Package,
  Upload,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['USUARIO', 'GESTOR', 'ADMIN'] },
  {
    id: 'equipments',
    label: 'Equipamentos',
    icon: Package,
    roles: ['USUARIO', 'GESTOR', 'ADMIN'],
  },
  { id: 'upload', label: 'Importar Dados', icon: Upload, roles: ['GESTOR', 'ADMIN'] },
  { id: 'users', label: 'Gestao de Acesso', icon: Users, roles: ['ADMIN'] },
];

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  onLogout,
  isCollapsed,
  setIsCollapsed,
}) => {
  const filteredItems = NAVIGATION_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/5 bg-accent text-white transition-all duration-500 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-24 items-center justify-between border-b border-white/5 px-4 md:px-6">
        {!isCollapsed ? (
          <div className="flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <span className="font-black text-xl md:text-2xl italic tracking-tighter text-primary whitespace-nowrap">
              TECNOLOC
              <span className="ml-2 rounded bg-white px-2 py-1 text-xs text-accent">DEV</span>
            </span>
            <span className="mt-2 text-[8px] font-bold uppercase text-gray-400 tracking-[0.2em] whitespace-nowrap">
              Frota Inteligente
            </span>
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <span className="font-black text-xl italic text-primary">T</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-3 px-3 py-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative flex w-full items-center gap-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary px-4 md:px-6 py-4 text-white shadow-[0_12px_28px_rgba(255,107,0,0.14)]'
                  : 'px-3 md:px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <div
                className={`rounded-2xl p-2.5 transition-all duration-300 ${
                  isActive ? 'bg-white/10' : ''
                }`}
              >
                <Icon
                  size={isActive ? 24 : 20}
                  className={isActive ? 'text-white' : 'group-hover:text-primary'}
                />
              </div>
              {!isCollapsed && (
                <span className="truncate text-left font-bold text-xs md:text-sm uppercase tracking-wider">
                  {item.label}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute right-0 h-8 w-1.5 rounded-l-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/5 p-3 md:p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center gap-4 rounded-xl px-3 md:px-4 py-3 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-widest">Recolher Menu</span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-4 rounded-2xl px-3 md:px-4 py-4 text-red-400 transition-all hover:bg-red-400/10"
        >
          <LogOut size={22} className="transition-transform group-hover:translate-x-1" />
          {!isCollapsed && <span className="font-bold text-xs uppercase tracking-wider">Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
