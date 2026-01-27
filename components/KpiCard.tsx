
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'green' | 'orange' | 'gray';
  trend?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    green: 'bg-primary/10 text-primary',
    orange: 'bg-secondary/10 text-secondary',
    gray: 'bg-accent/10 text-accent'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
      <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold text-accent">{value}</span>
          {trend && <span className="text-xs font-semibold text-green-600">{trend}</span>}
        </div>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default KpiCard;
