import React from 'react'



interface SpeedLinesConfig {
  /** Number of speed lines to render */
  count: number
  /** Horizontal spacing between lines */
  spacing: number
  /** Vertical offset between lines */
  verticalOffset: number
  /** Stroke width of speed lines */
  strokeWidth: number
  /** Animation delay step between lines */
  animationDelayStep: number
}

type SpeedLinesProps = {
  /** Configuration for speed lines */
  config: SpeedLinesConfig
}

/**
 * SpeedLines component for creating animated speed effect lines
 * Optimized with proper staggered animations and reduced motion support
 */
export const SpeedLines: React.FC<SpeedLinesProps> = ({ config }) => {
  const { count, animationDelayStep } = config

  // Generate speed lines that flow from 1 o'clock to 7 o'clock direction
  const speedLines = Array.from({ length: count }, (_, i) => {
    // Multiple random seeds for more variation
    const seed1 = (i * 137.5) % 100
    const seed2 = (i * 213.7) % 100
    const seed3 = (i * 89.3) % 100

    // Spread lines across a much wider area around rocket
    const baseX = 200 + ((seed1 * 8) % 800) // Much wider spread
    const baseY = 100 + ((seed2 * 6) % 500) // Higher spread

    // More varied line lengths for depth
    const lineLength = 20 + ((seed1 * 1.2) % 80) // Bigger variation

    // Lines pointing toward 7-8 o'clock direction
    const deltaX = -lineLength * 0.707
    const deltaY = lineLength * 0.707

    // Much more random delays and faster overall speed
    const randomDelay = (seed3 * 12) % 600 // More stagger
    const speedMultiplier = 0.6 + (seed2 % 40) / 100 // Varying speeds

    // More varied opacity for better depth
    const baseOpacity = 0.15 + (seed1 % 70) / 100

    return {
      key: `speed-line-${i}`,
      x1: baseX,
      y1: baseY,
      x2: baseX + deltaX,
      y2: baseY + deltaY,
      delay: randomDelay + i * animationDelayStep * 0.05, // Less uniform timing
      opacity: baseOpacity,
      width: 0.3 + (seed2 % 6) * 0.4, // More width variation
      speed: speedMultiplier, // Individual speed control
    }
  })

  return (
    <g className="speed-lines" role="presentation" aria-hidden="true">
      {speedLines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="url(#speedLines)"
          strokeWidth={line.width}
          strokeLinecap="round"
          className={`speed-line animate-speed-line transition-opacity duration-300`}
          style={{
            animationDelay: `${line.delay}ms`,
            animationDuration: `${800 * line.speed}ms`, // Individual speed control
            opacity: line.opacity * 0.5,
          }}
        />
      ))}
    </g>
  )
}
