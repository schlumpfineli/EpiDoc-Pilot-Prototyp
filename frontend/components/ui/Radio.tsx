import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

/**
 * Wiederverwendbare Radio-Group-Komponente
 * Fluide Größen und responsive Layout
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  className = '',
  layout = 'vertical',
}) => {
  const layoutClasses =
    layout === 'horizontal'
      ? 'grid gap-[var(--spacing-s)] sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2'
      : 'space-y-[var(--spacing-s)]';

  return (
    <div className={`space-y-[var(--spacing-2xs)] ${className}`}>
      {label && (
        <label className="text-body block font-medium text-foreground-800">
          {label}
        </label>
      )}
      <div className={layoutClasses}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`text-body flex cursor-pointer items-center gap-[var(--spacing-s)] rounded-xl border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-s)] font-medium shadow-sm transition hover:border-primary-200 hover:shadow-md ${
              option.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={option.disabled}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p className="text-body-small text-warning-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

