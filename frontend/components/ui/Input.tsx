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

  const baseInputClasses = 'text-body rounded-xl border bg-white text-[#1E3F34] placeholder:text-[#6E847A] focus:outline-none focus:ring-1 transition';
  const stateClasses = hasError
    ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-200'
    : 'border-[#DDE7E2] focus:border-[#3E7C67] focus:ring-[#3E7C67]/20';
  const sizeClasses = 'px-4 py-2.5';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`space-y-[var(--spacing-2xs)] ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-body block font-medium text-[#1E3F34]"
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

