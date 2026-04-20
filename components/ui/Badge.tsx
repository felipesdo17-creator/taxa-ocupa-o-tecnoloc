import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  const baseClass = 'inline-flex items-center gap-1.5 rounded-2xl font-black uppercase tracking-wider';

  const variantClasses = {
    success: 'bg-blue-50 text-blue-600 border border-blue-100',
    warning: 'bg-orange-50 text-orange-600 border border-orange-100',
    danger: 'bg-red-50 text-red-600 border border-red-100',
    info: 'bg-purple-50 text-purple-600 border border-purple-100',
    neutral: 'bg-gray-50 text-gray-600 border border-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-[8px]',
    md: 'px-4 py-1.5 text-[9px]',
  };

  const combinedClassName = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={combinedClassName}>
      {icon && <span className="h-3 w-3 flex items-center justify-center flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
