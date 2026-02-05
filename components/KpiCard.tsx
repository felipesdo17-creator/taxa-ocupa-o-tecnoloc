import React from 'react';
import { LucideIcon } from 'lucide-react';
import Card from './ui/Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'orange' | 'gray';
  trend?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  trend,
}) => {
  const bgClasses = {
    green: 'bg-orange-100',
    orange: 'bg-gray-100',
    gray: 'bg-purple-100',
  };

  const iconClasses = {
    green: 'text-orange-600',
    orange: 'text-gray-600',
    gray: 'text-purple-600',
  };

  return (
    <Card className="transition-transform hover:shadow-lg">
      <div className="flex flex-col">
        <div className={`p-3 rounded-2xl w-fit ${bgClasses[color]}`}>
          <Icon size={32} className={iconClasses[color]} />
        </div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">
          {title}
        </h3>
        <span className="text-4xl md:text-5xl font-black text-accent mb-1">{value}</span>
        {subtitle && <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>}
        {trend && <span className="text-xs font-semibold text-green-600 mt-2">{trend}</span>}
      </div>
    </Card>
  );
};

export default KpiCard;
