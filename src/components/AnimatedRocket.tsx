'use client'

import React from 'react'
import { useScrollEffect, useReducedMotion, useResponsive, useAnimationLifecycle } from './AnimatedRocket/hooks'
import { SVGDefs } from './AnimatedRocket/SVGDefs'
import { RocketBody } from './AnimatedRocket/RocketBody'
import { RocketNose } from './AnimatedRocket/RocketNose'
import { SpeedLines } from './AnimatedRocket/SpeedLines'
import { ANIMATION_CONFIG, RESPONSIVE_CONFIG } from './AnimatedRocket/constants'
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

  // Get responsive viewBox
  const getViewBox = () => {
    switch (screenSize) {
      case 'mobile':
        return RESPONSIVE_CONFIG.VIEWBOX.MOBILE
      case 'tablet':
        return RESPONSIVE_CONFIG.VIEWBOX.TABLET
      default:
        return RESPONSIVE_CONFIG.VIEWBOX.DESKTOP
    }
  }

  return (
    <div
      className={`
        pointer-events-none fixed inset-0 z-0 transition-all duration-300
        ${className || ''}
      `}
      aria-hidden="true"
      style={{
        filter: `blur(${scrollBlur}px)`,
        opacity: scrollOpacity,
      }}
    >
      <svg
        className={`
          w-full h-full
          transition-opacity duration-300
          ${showEffects ? 'opacity-100' : 'opacity-90'}
          ${prefersReducedMotion ? 'motion-reduce:transition-none' : ''}
        `}
        viewBox={getViewBox()}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Animated rocket background illustration"
      >
        <title>Animated rocket background - {name}</title>
        
        {/* SVG Definitions - Gradients and Filters */}
        <SVGDefs includeFilters={!prefersReducedMotion} />

        {/* Speed Lines Effect */}
        <SpeedLines
          showEffects={showEffects}
          prefersReducedMotion={prefersReducedMotion}
          config={ANIMATION_CONFIG.SPEED_LINES}
        />

        {/* Main Rocket Container - unified transform group */}
        <RocketBody
          showEffects={showEffects}
          prefersReducedMotion={prefersReducedMotion}
          screenSize={screenSize}
        >
          <RocketNose
            showEffects={showEffects}
            prefersReducedMotion={prefersReducedMotion}
            screenSize={screenSize}
          />
        </RocketBody>
      </svg>
    </div>
  )
}

export default AnimatedRocket
