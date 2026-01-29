"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary für React-Komponenten
 * Fängt JavaScript-Fehler in der Komponenten-Baumstruktur ab
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aktualisiere den State, sodass der nächste Render die Fallback-UI zeigt
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logge den Fehler an einen Error-Reporting-Service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Hier könnte man einen Error-Reporting-Service aufrufen
    // z.B. Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback-UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-[var(--spacing-m)] bg-background-50">
          <div className="max-w-md w-full space-y-[var(--spacing-l)]">
            <div className="text-center space-y-[var(--spacing-s)]">
              <h1 className="text-h1 text-foreground-900">
                Etwas ist schiefgelaufen
              </h1>
              <p className="text-body text-foreground-600">
                Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
              </p>
            </div>

            <div className="rounded-xl border border-warning-200 bg-warning-50 p-[var(--spacing-m)] space-y-[var(--spacing-s)]">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="space-y-[var(--spacing-xs)]">
                  <p className="text-body-small font-medium text-warning-800">
                    Fehler-Details (nur in Entwicklung):
                  </p>
                  <pre className="text-body-small text-warning-700 bg-warning-100 p-[var(--spacing-s)] rounded-lg overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-[var(--spacing-s)]">
              <Button
                variant="primary"
                fullWidth
                onClick={this.handleReset}
              >
                Erneut versuchen
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Zur Startseite
              </Button>
            </div>

            <div className="text-center">
              <p className="text-body-small text-foreground-600">
                Wenn das Problem weiterhin besteht,{" "}
                <a
                  href="mailto:support@epidoc.com"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  kontaktieren Sie uns
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

