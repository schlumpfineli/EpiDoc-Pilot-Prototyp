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
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'bg-white border border-[#DDE7E2]',
    outlined: 'bg-white border border-[#DDE7E2]',
    elevated: 'bg-white shadow-[0_1px_2px_rgba(30,63,52,0.05)]',
  };

  return (
    <div
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

