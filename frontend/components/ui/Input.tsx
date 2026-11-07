"use client";

import React, { useId, useMemo, useState } from 'react';

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
  type = 'text',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = useMemo(() => id || generatedId, [id, generatedId]);
  const hasError = !!error;
  const isPassword =
    type === 'password' ||
    props.name === 'password' ||
    props.name === 'password_confirmation' ||
    props.name === 'current_password' ||
    props.name === 'new_password' ||
    props.name === 'new_password_confirmation';
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputType = isPassword ? (passwordVisible ? 'text' : 'password') : type;

  const baseInputClasses = 'text-body rounded-xl border bg-white text-[#1F352D] placeholder:text-[#6B7C74] focus:outline-none focus:ring-1 transition';
  const stateClasses = hasError
    ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-200'
    : 'border-[#DDE7E2] focus:border-[#3E7C67] focus:ring-[#3E7C67]/20';
  const sizeClasses = 'px-4 py-2.5';
  const widthClass = fullWidth ? 'w-full' : '';
  const passwordPadding = isPassword ? 'pr-12' : '';

  return (
    <div className={`space-y-[var(--spacing-2xs)] ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-body block font-medium text-[#2E4A3F]"
        >
          {label}
          {props.required && <span className="text-foreground-800 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
      <input
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        ref={ref}
        id={inputId}
        type={inputType}
        data-testid={props['data-testid'] || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)}
        className={`${baseInputClasses} ${stateClasses} ${sizeClasses} ${widthClass} ${passwordPadding} ${className}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        suppressHydrationWarning
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setPasswordVisible((visible) => !visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7368] hover:text-[#1E3F34]"
          aria-label={passwordVisible ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {passwordVisible ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
      )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-body-small text-warning-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-body-small text-[#4F6A5F]">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

