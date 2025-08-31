import React from 'react';
import type { RocketBodyProps } from './types';
import { ROCKET_BODY_PATH, ANIMATION_CONFIG } from './constants';

/**
 * RocketBody component containing the main rocket SVG paths
 * Separated for better maintainability and responsive design
 */
export const RocketBody: React.FC<RocketBodyProps> = ({
  showEffects,
  prefersReducedMotion,
  screenSize,
  children,
}) => {
  // Get responsive transform based on screen size
  const getResponsiveTransform = () => {
    switch (screenSize) {
      case 'mobile':
        return ANIMATION_CONFIG.ROCKET.POSITION.MOBILE;
      case 'tablet':
        return ANIMATION_CONFIG.ROCKET.POSITION.TABLET;
      default:
        return ANIMATION_CONFIG.ROCKET.POSITION.DESKTOP;
    }
  };

  const transform = getResponsiveTransform();

  return (
    <g 
      transform={transform}
      className={`
        rocket-group
        transition-transform duration-500 ease-out
        ${showEffects ? 'opacity-100' : 'opacity-90'}
      `}
      role="img"
      aria-label="Animated rocket illustration"
    >
      {/* Rocket body (lower gradient section) with heat effects */}
      <g className="rocket-body-group">
        <path
          d={ROCKET_BODY_PATH}
          fill="url(#rocketBody)"
          className={`
            rocket-body-path
            transition-all duration-300
            ${showEffects && !prefersReducedMotion ? 'animate-rocket-heat' : ''}
            ${prefersReducedMotion ? 'motion-reduce:animate-none' : ''}
          `}
          style={{
            willChange: showEffects ? 'filter, transform' : 'auto',
          }}
        />
        
        {/* Heat distortion overlay - only show with effects active */}
        {showEffects && (
          <path
            d={ROCKET_BODY_PATH}
            fill="url(#engineGlow)"
            className={`
              heat-overlay
              transition-opacity duration-500
              ${!prefersReducedMotion ? 'animate-heat-distortion' : 'opacity-30'}
              ${prefersReducedMotion ? 'motion-reduce:animate-none' : ''}
            `}
            style={{
              opacity: 0.3,
              willChange: prefersReducedMotion ? 'auto' : 'opacity, transform',
            }}
          />
        )}
      </g>

      {/* Render children within the same transform group */}
      {children}
    </g>
  );
};