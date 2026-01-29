import React, { useId, useMemo } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
}

/**
 * Wiederverwendbare Select/Dropdown-Komponente
 * Fluide Größen basierend auf Design-System
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  id,
  onChange,
  placeholder,
  value,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = useMemo(() => id || generatedId, [id, generatedId]);
  const hasError = !!error;

  const baseClasses = 'text-body rounded-xl border shadow-sm focus:outline-none focus:ring-2 transition appearance-none bg-white';
  const stateClasses = hasError
    ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-200'
    : 'border-background-200 focus:border-primary-500 focus:ring-primary-200';
  const sizeClasses = 'px-[var(--spacing-m)] py-[var(--spacing-s)]';
  const widthClass = fullWidth ? 'w-full' : '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`space-y-[var(--spacing-2xs)] ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-body block font-medium text-foreground-800"
        >
          {label}
          {props.required && <span className="text-foreground-800 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={handleChange}
          className={`${baseClasses} ${stateClasses} ${sizeClasses} ${widthClass} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-[var(--spacing-m)]">
          <svg
            className="h-5 w-5 text-foreground-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-body-small text-warning-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${selectId}-helper`} className="text-body-small text-foreground-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

