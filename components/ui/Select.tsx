import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseSelectClass = `w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer font-medium text-accent`;

    const selectClassName = error
      ? `${baseSelectClass} border-red-300 focus:ring-red-200`
      : baseSelectClass;

    const containerClass = `flex flex-col gap-2 relative ${className}`;

    return (
      <div className={containerClass}>
        {label && (
          <label className="text-xs font-black text-accent uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={selectClassName}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
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

Select.displayName = 'Select';

export default Select;
