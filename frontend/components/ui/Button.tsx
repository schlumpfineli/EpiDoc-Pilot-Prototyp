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
  const baseClasses = 'text-body rounded-2xl font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  
  const variantClasses = {
    primary: 'bg-[#3F7A63] text-[#FFFFFF] hover:bg-[#346B55] active:bg-[#346B55] focus-visible:outline-[#3F7A63]',
    secondary: 'border border-[#9FB8AE] bg-transparent text-[#1E3F34] hover:bg-[#EEF4F1] focus-visible:outline-[#3E7C67]',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-body-small',
    md: 'px-5 py-3.5',
    lg: 'px-6 py-4 text-h5',
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

