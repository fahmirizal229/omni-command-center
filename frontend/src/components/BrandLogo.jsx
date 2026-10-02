import React from 'react';

/**
 * Master Concept: The Isometric FR Core (Fahmi Rizal)
 * Metaphor: 3D Isometric Cube with negative space data channels forming F & R monogram.
 */
export function BrandLogo({ className = "w-6 h-6", ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      fill="currentColor"
      className={className}
      {...props}
    >
      <g id="isometric-fr-core">
        {/* Top Face: Distributed Cloud Plane (Rhombus) */}
        <path d="M 256 76 L 396 156 L 256 236 L 116 156 Z" opacity="0.95" />
        
        {/* Left Face (F Architecture) */}
        {/* F Spine (Vertical Pillar) */}
        <path d="M 116 178 L 158 202 L 158 410 L 116 386 Z" opacity="0.85" />
        {/* F Top Arm */}
        <path d="M 174 211 L 246 252 L 246 292 L 174 251 Z" opacity="0.85" />
        {/* F Middle Arm */}
        <path d="M 174 271 L 226 301 L 226 341 L 174 311 Z" opacity="0.85" />
        {/* F Lower Foundation Node */}
        <path d="M 174 331 L 246 372 L 246 412 L 174 371 Z" opacity="0.85" />

        {/* Right Face (R Architecture) */}
        {/* R Left Vertical Spine */}
        <path d="M 266 252 L 308 228 L 308 436 L 266 412 Z" opacity="0.75" />
        {/* R Top Loop */}
        <path d="M 324 218 L 396 178 L 396 280 L 324 320 Z" opacity="0.75" />
        {/* R Diagonal Thrust Leg */}
        <path d="M 324 340 L 396 298 L 396 422 L 324 380 Z" opacity="0.75" />
      </g>
    </svg>
  );
}

export function BrandLogoBadge({ size = "md", className = "" }) {
  const sizeClasses = {
    xs: "w-6 h-6 p-1 rounded-lg",
    sm: "w-7 h-7 p-1 rounded-lg",
    md: "w-9 h-9 p-1.5 rounded-xl",
    lg: "w-11 h-11 p-2 rounded-xl",
    xl: "w-14 h-14 p-2.5 rounded-2xl"
  };

  return (
    <div className={`relative flex items-center justify-center transition-all duration-300 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      <BrandLogo className="w-full h-full" />
    </div>
  );
}
