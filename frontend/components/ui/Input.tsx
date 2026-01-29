import React, { useId, useMemo } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  'data-testid'?: string;
}

/**
 * Wiederverwendbare Input-Komponente mit Label und Fehlerbehandlung
 * Fluide Größen basierend auf Design-System
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = useMemo(() => id || generatedId, [id, generatedId]);
  const hasError = !!error;

  const baseInputClasses = 'text-body rounded-xl border shadow-sm focus:outline-none focus:ring-2 transition';
  const stateClasses = hasError
    ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-200'
    : 'border-background-200 focus:border-primary-500 focus:ring-primary-200';
  const sizeClasses = 'px-[var(--spacing-m)] py-[var(--spacing-s)]';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`space-y-[var(--spacing-2xs)] ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-body block font-medium text-foreground-800"
        >
          {label}
          {props.required && <span className="text-foreground-800 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        data-testid={props['data-testid'] || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)}
        className={`${baseInputClasses} ${stateClasses} ${sizeClasses} ${widthClass} ${className}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        suppressHydrationWarning
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-body-small text-warning-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-body-small text-foreground-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

