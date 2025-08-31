import React from 'react';
import type { SpeedLinesProps } from './types';

/**
 * SpeedLines component for creating animated speed effect lines
 * Optimized with proper staggered animations and reduced motion support
 */
export const SpeedLines: React.FC<SpeedLinesProps> = ({
  showEffects,
  prefersReducedMotion,
  config,
}) => {
  const { count, spacing, verticalOffset, strokeWidth, animationDelayStep } = config;

  // Generate speed lines array
  const speedLines = Array.from({ length: count }, (_, i) => ({
    key: `speed-${i}`,
    x1: 1000 + i * spacing,
    y1: 150 + i * verticalOffset,
    x2: 900 + i * spacing,
    y2: 250 + i * verticalOffset,
    delay: i * animationDelayStep,
  }));

  return (
    <g 
      className="speed-lines"
      role="presentation"
      aria-hidden="true"
    >
      {speedLines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="url(#speedLines)"
          strokeWidth={strokeWidth}
          className={`
            speed-line
            transition-opacity duration-300
            ${showEffects && !prefersReducedMotion ? 'animate-speed-line' : 'opacity-0'}
            ${prefersReducedMotion ? 'motion-reduce:animate-none' : ''}
          `}
          style={{
            animationDelay: `${line.delay}ms`,
            opacity: showEffects && prefersReducedMotion ? 0.5 : 0,
          }}
        />
      ))}
    </g>
  );
};