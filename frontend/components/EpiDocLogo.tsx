'use client';

import { useState, useEffect } from 'react';

interface EpiDocLogoProps {
  className?: string;
  width?: number;
  height?: number;
  size?: number; // Für gleichmäßige Größe
}

export function EpiDocLogo({ 
  className = '', 
  width, 
  height, 
  size 
}: EpiDocLogoProps) {
  // Verhindere Hydration Mismatch: Generiere ID nur Client-Side
  const [uniqueId, setUniqueId] = useState<string>('');
  
  useEffect(() => {
    // Generiere ID nur nach dem Mount (Client-Side)
    setUniqueId(Math.random().toString(36).substring(2, 9));
  }, []);
  
  // Fallback: Verwende statische ID während SSR
  const gradientId1 = uniqueId || 'gradient1-static';
  const gradientId2 = uniqueId || 'gradient2-static';
  const gradientId3 = uniqueId || 'gradient3-static';

  // Wenn size angegeben ist, verwende es für width und height
  const finalWidth = size || width || 120;
  const finalHeight = size || height || 32;

  return (
    <svg
      viewBox="0 0 100 100"
      width={finalWidth}
      height={finalHeight}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Hellblauer Kreis Gradient */}
        <linearGradient id={`gradient1-${gradientId1}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2F7" />
          <stop offset="100%" stopColor="#87CEEB" />
        </linearGradient>
        
        {/* Mittelblauer Kreis Gradient (Hauptkreis) */}
        <linearGradient id={`gradient2-${gradientId2}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2979FF" />
          <stop offset="100%" stopColor="#1E90FF" />
        </linearGradient>
        
        {/* Dunkelblauer Kreis Gradient */}
        <linearGradient id={`gradient3-${gradientId3}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#194A7D" />
          <stop offset="100%" stopColor="#4169E1" />
        </linearGradient>
      </defs>

      {/* Hellblauer Kreis (links oben, hinten) */}
      <circle 
        cx="30" 
        cy="30" 
        r="22" 
        fill={`url(#gradient1-${gradientId1})`} 
        opacity="0.95"
      />

      {/* Dunkelblauer Kreis (unten links, Mitte) */}
      <circle 
        cx="30" 
        cy="70" 
        r="22" 
        fill={`url(#gradient3-${gradientId3})`} 
        opacity="0.95"
      />

      {/* Mittelblauer Kreis (rechts/vorne, größter) */}
      <circle 
        cx="65" 
        cy="50" 
        r="28" 
        fill={`url(#gradient2-${gradientId2})`} 
        opacity="0.95"
      />
    </svg>
  );
}

