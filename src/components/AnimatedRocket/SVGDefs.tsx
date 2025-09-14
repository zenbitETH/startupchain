import React from 'react'

import { FILTER_DEFINITIONS, GRADIENT_DEFINITIONS } from './constants'

/**
 * SVG definitions component containing all gradients and filters
 * Separated for better organization and reusability
 */
export const SVGDefs = () => {
  return (
    <defs>
      {/* Gradient Definitions */}
      <linearGradient
        id={GRADIENT_DEFINITIONS.rocketBody.id}
        x1={GRADIENT_DEFINITIONS.rocketBody.x1}
        x2={GRADIENT_DEFINITIONS.rocketBody.x2}
        y1={GRADIENT_DEFINITIONS.rocketBody.y1}
        y2={GRADIENT_DEFINITIONS.rocketBody.y2}
      >
        {GRADIENT_DEFINITIONS.rocketBody.stops.map((stop, index) => (
          <stop key={index} offset={stop.offset} stopColor={stop.stopColor} />
        ))}
      </linearGradient>

      <linearGradient
        id={GRADIENT_DEFINITIONS.rocketNose.id}
        x1={GRADIENT_DEFINITIONS.rocketNose.x1}
        x2={GRADIENT_DEFINITIONS.rocketNose.x2}
        y1={GRADIENT_DEFINITIONS.rocketNose.y1}
        y2={GRADIENT_DEFINITIONS.rocketNose.y2}
      >
        {GRADIENT_DEFINITIONS.rocketNose.stops.map((stop, index) => (
          <stop key={index} offset={stop.offset} stopColor={stop.stopColor} />
        ))}
      </linearGradient>

      <linearGradient
        id={GRADIENT_DEFINITIONS.speedLines.id}
        x1={GRADIENT_DEFINITIONS.speedLines.x1}
        x2={GRADIENT_DEFINITIONS.speedLines.x2}
        y1={GRADIENT_DEFINITIONS.speedLines.y1}
        y2={GRADIENT_DEFINITIONS.speedLines.y2}
      >
        {GRADIENT_DEFINITIONS.speedLines.stops.map((stop, index) => (
          <stop
            key={index}
            offset={stop.offset}
            stopColor={stop.stopColor}
            stopOpacity={stop.stopOpacity}
          />
        ))}
      </linearGradient>

      <radialGradient
        id={GRADIENT_DEFINITIONS.engineGlow.id}
        cx={GRADIENT_DEFINITIONS.engineGlow.cx}
        cy={GRADIENT_DEFINITIONS.engineGlow.cy}
        r={GRADIENT_DEFINITIONS.engineGlow.r}
      >
        {GRADIENT_DEFINITIONS.engineGlow.stops.map((stop, index) => (
          <stop
            key={index}
            offset={stop.offset}
            stopColor={stop.stopColor}
            stopOpacity={stop.stopOpacity}
          />
        ))}
      </radialGradient>

      {/* Filter Definitions - Only include if requested for performance */}

      <filter
        id={FILTER_DEFINITIONS.speedGlow.id}
        x={FILTER_DEFINITIONS.speedGlow.x}
        y={FILTER_DEFINITIONS.speedGlow.y}
        width={FILTER_DEFINITIONS.speedGlow.width}
        height={FILTER_DEFINITIONS.speedGlow.height}
      >
        <feGaussianBlur stdDeviation="3" result="glow1" />
        <feGaussianBlur stdDeviation="6" result="glow2" />
        <feGaussianBlur stdDeviation="12" result="glow3" />
        <feMerge>
          <feMergeNode in="glow3" />
          <feMergeNode in="glow2" />
          <feMergeNode in="glow1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter
        id={FILTER_DEFINITIONS.particleGlow.id}
        x={FILTER_DEFINITIONS.particleGlow.x}
        y={FILTER_DEFINITIONS.particleGlow.y}
        width={FILTER_DEFINITIONS.particleGlow.width}
        height={FILTER_DEFINITIONS.particleGlow.height}
      >
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
  )
}
