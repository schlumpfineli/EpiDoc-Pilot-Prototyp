import React, { useId, useMemo } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Wiederverwendbare Textarea-Komponente
 * Fluide Größen basierend auf Design-System
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  id,
  rows = 4,
  ...props
}, ref) => {
  const generatedId = useId();
  const textareaId = useMemo(() => id || generatedId, [id, generatedId]);
  const hasError = !!error;

  const baseClasses = 'text-body rounded-xl border bg-white text-[#1E3F34] placeholder:text-[#6E847A] focus:outline-none focus:ring-1 transition resize-y';
  const stateClasses = hasError
    ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-200'
    : 'border-[#DDE7E2] focus:border-[#3E7C67] focus:ring-[#3E7C67]/20';
  const sizeClasses = 'px-4 py-2.5';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`space-y-[var(--spacing-2xs)] ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-body block font-medium text-[#1E3F34]"
        >
          {label}
          {props.required && <span className="text-foreground-800 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`${baseClasses} ${stateClasses} ${sizeClasses} ${widthClass} ${className}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-body-small text-warning-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${textareaId}-helper`} className="text-body-small text-foreground-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

