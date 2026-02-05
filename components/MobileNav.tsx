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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 px-4 pb-safe pt-3 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 py-2 transition-all active:scale-90 ${
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
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
