import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      loading = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClass = 'font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 relative uppercase tracking-wider';

    // Variant classes
    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
      secondary: 'bg-gray-100 text-accent hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
      danger: 'bg-red-100 text-red-600 hover:bg-red-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
      ghost: 'text-secondary hover:text-accent hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    };

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    };

    const combinedClassName = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span className="h-4 w-4 flex items-center justify-center">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
