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
    default: 'bg-white',
    outlined: 'bg-white border border-background-200',
    elevated: 'bg-white shadow-lg',
  };

  return (
    <div
      className={`rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

