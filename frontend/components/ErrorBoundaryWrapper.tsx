"use client";

import { ErrorBoundary } from "./ErrorBoundary";

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper-Komponente für Error Boundary
 * Wird im Root Layout verwendet
 */
export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

