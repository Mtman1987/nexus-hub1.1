
import type { SVGProps } from "react";

export function CommunityLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 100"
      {...props}
    >
      <defs>
        <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FDB813' }} />
          <stop offset="100%" style={{ stopColor: '#F97316' }} />
        </linearGradient>
        <linearGradient id="rocket-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FDB813' }} />
            <stop offset="100%" style={{ stopColor: '#F9A825' }} />
        </linearGradient>
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2DD4BF' }} />
          <stop offset="100%" style={{ stopColor: '#0D9488' }} />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>

      <g style={{ filter: 'url(#glow)' }}>
        {/* Flame/M shape */}
        <path d="M 20 100 L 40 20 L 55 60 L 70 20 L 90 100 L 55 80 Z" fill="url(#flame-gradient)" />
        
        {/* Rocket */}
        <g transform="translate(60, 10) rotate(20)">
            <path d="M 10 0 L 20 20 L 0 20 Z" fill="url(#rocket-gradient)" transform="translate(15, 25) rotate(180)"/>
            <path d="M 20 0 C 40 0, 40 25, 20 25 L 0 25 C -20 25, -20 0, 0 0 Z" fill="url(#rocket-gradient)" transform="translate(25, 0)"/>
            <circle cx="28" cy="12.5" r="4" fill="#111827"/>
        </g>
      </g>
      
      {/* Text */}
      <text x="95" y="60" fontSize="28" fontWeight="bold" fill="url(#text-gradient)" fontFamily="sans-serif">SPACE</text>
      <text x="95" y="90" fontSize="28" fontWeight="bold" fill="url(#text-gradient)" fontFamily="sans-serif">MOUNTAIN</text>
    </svg>
  );
}
