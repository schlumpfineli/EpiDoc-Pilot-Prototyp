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
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    accent: 'bg-accent-100 text-accent-800',
    success: 'bg-secondary-100 text-secondary-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-warning-100 text-warning-800',
  };

  const sizeClasses = {
    sm: 'px-[var(--spacing-2xs)] py-[var(--spacing-3xs)] text-body-small',
    md: 'px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body',
  };

  return (
    <span
      className={`inline-flex items-center gap-[var(--spacing-2xs)] rounded-full font-semibold shadow-sm ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

