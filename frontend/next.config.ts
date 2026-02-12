import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-optimierte Konfiguration
  reactStrictMode: true,

  // Turbopack Root-Verzeichnis explizit setzen
  turbopack: {
    root: __dirname,
  },
  
  // Wichtig für statische Assets
  trailingSlash: false,
  
  // Kompilierungs-Optionen
  compiler: {
    // Entferne console.log in Production (optional)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Security- und Caching-Headers
  async headers() {
    return [
      // Security-Headers für alle Seiten
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Caching für statische Assets
      {
        source: '/:all*(svg|jpg|png|webp|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
