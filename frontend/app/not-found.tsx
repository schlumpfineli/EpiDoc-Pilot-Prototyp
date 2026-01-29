"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)]">
      <div className="max-w-md w-full space-y-[var(--spacing-l)] text-center">
        <div className="space-y-[var(--spacing-s)]">
          <h1 className="text-h1 text-foreground-900">
            404
          </h1>
          <h2 className="text-h2 text-foreground-800">
            Seite nicht gefunden
          </h2>
          <p className="text-body text-foreground-600">
            Die angeforderte Seite existiert nicht.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-[var(--spacing-s)] justify-center">
          <Link href="/">
            <Button variant="primary">
              Zur Startseite
            </Button>
          </Link>
          <Link href="/diary">
            <Button variant="secondary">
              Zum Tagebuch
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

