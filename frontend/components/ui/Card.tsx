import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * Wiederverwendbare Card-Komponente
 * Fluide Padding basierend auf Design-System
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-[var(--spacing-s)]',
    md: 'p-[var(--spacing-m)]',
    lg: 'p-[var(--spacing-l)]',
  };

  const variantClasses = {
    default: 'bg-white border border-background-200/60',
    outlined: 'bg-white border border-background-300',
    elevated: 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
  };

  return (
    <div
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

