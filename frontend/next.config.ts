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
  
  // Headers für bessere Caching-Performance
  async headers() {
    return [
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
