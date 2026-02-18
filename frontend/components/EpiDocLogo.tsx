'use client';

interface EpiDocLogoProps {
  className?: string;
  width?: number;
  height?: number;
  size?: number;
}

export function EpiDocLogo({
  className = '',
  width,
  height,
  size,
}: EpiDocLogoProps) {
  const finalSize = size || width || height || 100;

  return (
    <svg
      viewBox="0 0 646 607"
      width={finalSize}
      height={finalSize}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="447" cy="408" r="199" fill="#3F7A63" />
      <circle cx="447" cy="156" r="156" fill="#9FC3B3" />
      <circle cx="223.5" cy="324.5" r="223.5" fill="#2E5D4C" />
    </svg>
  );
}
