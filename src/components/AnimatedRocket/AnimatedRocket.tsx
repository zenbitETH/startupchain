import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

import {
  ANIMATION_CONFIG,
  ROCKET_BODY_PATH,
  ROCKET_NOSE_PATH,
} from './constants'
import { SpeedLines } from './SpeedLines'
import { SVGDefs } from './SVGDefs'

const ScrollEffect = dynamic(
  () => import('./ScrollEffect').then(mod => mod.ScrollEffect),
  { ssr: false }
)

type RocketProps = {
  animated?: boolean
  speedLines?: boolean
  scrollEffect?: boolean
} & React.SVGProps<SVGSVGElement>

export default function AnimatedRocket({
  animated = false,
  speedLines = false,
  scrollEffect = false,
  className,
  ...svgProps
}: RocketProps) {
  return (
    <svg
      className={className}
      {...svgProps}
      viewBox="0 0 800 800"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* SVG Definitions - Gradients and Filters */}
      <SVGDefs />

      {/* Conditionally render ScrollEffect client component */}
      {scrollEffect && (
        <Suspense fallback={null}>
          <ScrollEffect />
        </Suspense>
      )}

      {/* Unified Animation Group - Rocket and Speed Lines move together */}
      <g id="rocket-group" className="animate-space-travel origin-center">
        {/* Speed Lines Effect - positioned relative to rocket */}
        {speedLines && <SpeedLines config={ANIMATION_CONFIG.SPEED_LINES} />}

        {/* Main Rocket Container */}
        <g
          className={`rocket-group opacity-85 transition-transform duration-500 ease-out`}
        >
          {/* Rocket body (lower gradient section) with heat effects */}
          <g className="rocket-body-group">
            <path
              d={ROCKET_BODY_PATH}
              fill="url(#rocketBody)"
              className={`rocket-body-path animate-rocket-heat transition-all duration-300`}
            />

            {/* Heat distortion overlay - only show with effects active */}
            <path
              d={ROCKET_BODY_PATH}
              fill="url(#engineGlow)"
              className={`heat-overlay animate-heat-distortion transition-opacity duration-500`}
            />

            {/* Engine pulse effect - subtle glow at engine */}
            <circle
              cx="400"
              cy="720"
              fill="url(#engineGlow)"
              className="animate-engine-pulse opacity-60"
            />
          </g>

          {/* Render children within the same transform group */}
          <path
            d={ROCKET_NOSE_PATH}
            fill="url(#rocketNose)"
            className={`rocket-nose drop-shadow-sm transition-all duration-300 ease-out`}
          />
        </g>
      </g>
    </svg>
  )
}
