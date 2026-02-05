import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    };

    const baseInputClass = `w-full rounded-2xl border border-gray-100 bg-white transition-all duration-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]}`;

    const inputClassName = error
      ? `${baseInputClass} border-red-300 focus:ring-red-200`
      : baseInputClass;

    const containerClass = `flex flex-col gap-2 ${className}`;

    return (
      <div className={containerClass}>
        {label && (
          <label className="text-xs font-black text-accent uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            className={`${inputClassName} ${icon ? 'pl-10' : ''}`}
            {...props}
          />
          {icon && (
            <span className="absolute left-3 text-gray-400 flex items-center justify-center h-5 w-5">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
