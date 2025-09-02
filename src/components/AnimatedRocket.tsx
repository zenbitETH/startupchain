'use client'

import React from 'react'

import { RocketBody } from './AnimatedRocket/RocketBody'
import { RocketNose } from './AnimatedRocket/RocketNose'
import { SVGDefs } from './AnimatedRocket/SVGDefs'
import { SpeedLines } from './AnimatedRocket/SpeedLines'
import { ANIMATION_CONFIG, RESPONSIVE_CONFIG } from './AnimatedRocket/constants'
import {
  useAnimationLifecycle,
  useReducedMotion,
  useResponsive,
  useScrollEffect,
} from './AnimatedRocket/hooks'
import type { AnimatedRocketProps } from './AnimatedRocket/types'

const DEFAULT_NAME = 'Your company'

export const AnimatedRocket: React.FC<AnimatedRocketProps> = ({
  name = DEFAULT_NAME,
  className,
  autoStart = true,
  scrollConfig,
  animationConfig,
}) => {
  // Use composed hooks for cleaner logic
  const { prefersReducedMotion } = useReducedMotion()
  const { scrollBlur, scrollOpacity } = useScrollEffect(scrollConfig)
  const { windowDimensions } = useResponsive()
  const { showEffects } = useAnimationLifecycle(
    autoStart,
    animationConfig?.initialDelay
  )

  return (
    <div
      className={`gpu-accelerated pointer-events-none fixed top-10 right-0 bottom-0 left-0 z-0 h-[calc(100vh-4rem)] transition-all duration-300 ${className || ''} `}
      aria-hidden="true"
      style={{
        '--scroll-blur': `${scrollBlur}px`,
        '--scroll-opacity': scrollOpacity,
        filter: 'blur(var(--scroll-blur))',
        opacity: 'var(--scroll-opacity)',
      } as React.CSSProperties}
    >
      <svg
        className={`h-full w-full transition-opacity duration-300 ${showEffects ? 'opacity-100' : 'opacity-90'} ${prefersReducedMotion ? 'motion-reduce:transition-none' : ''}`}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Animated rocket background illustration"
      >
        <title>Animated rocket background - {name}</title>

        {/* SVG Definitions - Gradients and Filters */}
        <SVGDefs includeFilters={!prefersReducedMotion} />

        {/* Unified Animation Group - Rocket and Speed Lines move together */}
        <g
          className={`animate-space-travel origin-center translate-x-50 -translate-y-180 scale-[1.2] sm:-translate-y-90 sm:scale-[0.8] md:translate-x-30 md:-translate-y-70 md:scale-[0.7] lg:translate-x-[500px] lg:translate-y-0 lg:scale-[0.8]`}
        >
          {/* Speed Lines Effect - positioned relative to rocket */}
          <SpeedLines
            showEffects={showEffects}
            prefersReducedMotion={prefersReducedMotion}
            config={ANIMATION_CONFIG.SPEED_LINES}
          />

          {/* Main Rocket Container */}
          <RocketBody
            showEffects={showEffects}
            prefersReducedMotion={prefersReducedMotion}
          >
            <RocketNose
              showEffects={showEffects}
              prefersReducedMotion={prefersReducedMotion}
            />
          </RocketBody>
        </g>
      </svg>
    </div>
  )
}

export default AnimatedRocket
