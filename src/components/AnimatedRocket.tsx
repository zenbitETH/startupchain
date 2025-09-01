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
  const { screenSize } = useResponsive()
  const { showEffects } = useAnimationLifecycle(
    autoStart,
    animationConfig?.initialDelay
  )

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 transition-all duration-300 ${className || ''} `}
      aria-hidden="true"
      style={{
        filter: `blur(${scrollBlur}px)`,
        opacity: scrollOpacity,
      }}
    >
      <svg
        className={`h-full w-full transition-opacity duration-300 ${showEffects ? 'opacity-100' : 'opacity-90'} ${prefersReducedMotion ? 'motion-reduce:transition-none' : ''} border-2 border-red-500`}
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
          className={`unified-animation-group ${showEffects && !prefersReducedMotion ? 'animate-space-travel' : ''} ${prefersReducedMotion ? 'motion-reduce:animate-none' : ''} `}
          style={{
            transform: 'translate(200px, 0) scale(0.8)',
            transformOrigin: 'center'
          }}
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
