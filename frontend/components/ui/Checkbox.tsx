import React from 'react';

export interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  name: string;
  options: CheckboxOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

/**
 * Wiederverwendbare Checkbox-Group-Komponente
 * Fluide Größen und responsive Layout
 */
export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  options,
  value = [],
  onChange,
  label,
  error,
  className = '',
  layout = 'vertical',
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  const layoutClasses =
    layout === 'horizontal'
      ? 'grid gap-[var(--spacing-s)] sm:grid-cols-2'
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
            className={`text-body flex cursor-pointer items-center gap-[var(--spacing-2xs)] ${
              option.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={option.disabled}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
            />
            <span className="text-body-small text-foreground-700">{option.label}</span>
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

