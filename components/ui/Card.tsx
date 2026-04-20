import React from 'react';

interface CardProps {
  variant?: 'default' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
}) => {
  const baseClass = 'bg-white rounded-[2.5rem] border border-gray-100';

  const variantClasses = {
    default: 'shadow-sm',
    elevated: 'shadow-xl',
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12',
  };

  const combinedClassName = `${baseClass} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return <div className={combinedClassName}>{children}</div>;
};

export default Card;
