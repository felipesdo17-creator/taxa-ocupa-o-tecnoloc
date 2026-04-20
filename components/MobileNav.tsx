import React from 'react';
import { BarChart3, Package, Upload, Users } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, userRole }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['USUARIO', 'GESTOR', 'ADMIN'] },
    { id: 'equipments', label: 'Frota', icon: Package, roles: ['USUARIO', 'GESTOR', 'ADMIN'] },
    { id: 'upload', label: 'Importar', icon: Upload, roles: ['GESTOR', 'ADMIN'] },
    { id: 'users', label: 'Gestão', icon: Users, roles: ['ADMIN'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-gray-100 bg-white/95 px-2 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div
        className="grid items-center gap-1"
        style={{ gridTemplateColumns: `repeat(${filteredItems.length}, minmax(0, 1fr))` }}
      >
        {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-2 transition-all active:scale-90 ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <div
              className={`p-2.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-primary/10 shadow-inner' : ''
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className="truncate px-1 text-[8px] font-black uppercase tracking-[0.18em]">
              {item.label}
            </span>
          </button>
        );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
