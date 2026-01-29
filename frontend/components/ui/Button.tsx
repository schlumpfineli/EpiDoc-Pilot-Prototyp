import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  'data-testid'?: string;
}

/**
 * Wiederverwendbare Button-Komponente mit fluiden Größen
 * Verwendet Design-System-Variablen für konsistente Abstände
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'text-body rounded-xl font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-primary-500',
    secondary: 'border border-secondary-500 bg-white text-secondary-700 hover:border-secondary-600 hover:bg-secondary-50 focus-visible:outline-secondary-500',
  };

  const sizeClasses = {
    sm: 'px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body-small',
    md: 'px-[var(--spacing-m)] py-[var(--spacing-s)]',
    lg: 'px-[var(--spacing-l)] py-[var(--spacing-m)] text-h5',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const testId = props['data-testid'] || (typeof children === 'string' ? `button-${children.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const { 'data-testid': _, ...restProps } = props;

  return (
    <button
      data-testid={testId}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...restProps}
    >
      {children}
    </button>
  );
};

