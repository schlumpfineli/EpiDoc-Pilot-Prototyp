import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Wiederverwendbare Badge/Tag-Komponente
 * Fluide Größen
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-primary-50 text-primary-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    accent: 'bg-accent-100 text-accent-800',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-caution-100 text-caution-700',
    error: 'bg-warning-100 text-warning-700',
  };

  const sizeClasses = {
    sm: 'px-[var(--spacing-2xs)] py-[var(--spacing-3xs)] text-body-small',
    md: 'px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body-small',
  };

  return (
    <span
      className={`inline-flex items-center gap-[var(--spacing-2xs)] rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

