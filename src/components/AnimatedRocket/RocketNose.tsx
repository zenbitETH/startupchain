import React from 'react';
import type { RocketBodyProps } from './types';
import { ROCKET_NOSE_PATH } from './constants';

/**
 * RocketNose component for the upper blue section of the rocket
 * Isolated for better maintainability and potential future enhancements
 */
export const RocketNose: React.FC<RocketBodyProps> = ({
  showEffects,
  prefersReducedMotion,
  screenSize,
}) => {
  return (
    <path
      d={ROCKET_NOSE_PATH}
      fill="url(#rocketNose)"
      className={`
        rocket-nose
        transition-all duration-300 ease-out
        ${showEffects ? 'drop-shadow-sm' : ''}
        ${showEffects && !prefersReducedMotion ? 'hover:drop-shadow-md' : ''}
        motion-reduce:transition-none
      `}
      style={{
        willChange: showEffects && !prefersReducedMotion ? 'filter' : 'auto',
      }}
    />
  );
};