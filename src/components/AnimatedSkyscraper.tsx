'use client'

import Image from 'next/image'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export type AnimatedSkyscraperProps = {
  name?: string
}

const DEFAULT_NAME = 'Your company'

export const AnimatedSkyscraper: React.FC<AnimatedSkyscraperProps> = ({
  name = DEFAULT_NAME,
}) => {
  const outlinePathRef = useRef<SVGPathElement | null>(null)
  const [outlineLength, setOutlineLength] = useState<number>(0)
  const [hasTypedOnce, setHasTypedOnce] = useState<boolean>(false)
  const [showGlints, setShowGlints] = useState<boolean>(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [scrollBlur, setScrollBlur] = useState<number>(0)
  const [scrollOpacity, setScrollOpacity] = useState<number>(1)

  // Detect reduced motion
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handle = () => setPrefersReducedMotion(media.matches)
    handle()
    media.addEventListener('change', handle)
    return () => media.removeEventListener('change', handle)
  }, [])

  // Compute outline path length
  useEffect(() => {
    if (!outlinePathRef.current) return
    try {
      const length = outlinePathRef.current.getTotalLength()
      setOutlineLength(length)
    } catch {}
  }, [])

  // Trigger glints after build if motion allowed
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowGlints(true)
      return
    }
    const totalMs = 1200 + 1200
    const timer = window.setTimeout(() => setShowGlints(true), totalMs)
    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion])

  // Scroll effect (blur, opacity, scale) - lightweight throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (timeoutId) return // Already scheduled

      timeoutId = setTimeout(() => {
        const scrollY = window.scrollY
        const effectStart = 100 // Start effects after 100px scroll
        const effectComplete = 600 // Complete effects at 600px scroll

        if (scrollY <= effectStart) {
          setScrollBlur(0)
          setScrollOpacity(1)
        } else if (scrollY >= effectComplete) {
          setScrollBlur(15) // More blur
          setScrollOpacity(0.3) // Lower opacity
        } else {
          const progress =
            (scrollY - effectStart) / (effectComplete - effectStart)
          setScrollBlur(progress * 15)
          setScrollOpacity(1 - progress * 0.7) // From 1 to 0.3
        }
        timeoutId = null
      }, 8) // 8ms throttle (~120fps max)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Call once to set initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // One-time sweep activation on first non-empty name
  const nonEmpty = (name || '').trim().length > 0 && name !== DEFAULT_NAME
  useEffect(() => {
    if (nonEmpty && !prefersReducedMotion) setHasTypedOnce(true)
  }, [nonEmpty, prefersReducedMotion])

  // Windows that follow the actual building shape
  const windowGrid = useMemo(() => {
    const windows: { x: number; y: number; width: number; height: number }[] =
      []

    // Building tiers with 50% bigger windows and proper positioning
    const buildingTiers = [
      // Extended base level 1: x 50-470, y 720-800
      {
        leftX: 70,
        rightX: 450,
        topY: 740,
        bottomY: 780,
        windowWidth: 6,
        windowHeight: 12,
      },
      // Extended base level 2: x 50-470, y 640-720
      {
        leftX: 70,
        rightX: 450,
        topY: 660,
        bottomY: 700,
        windowWidth: 6,
        windowHeight: 12,
      },
      // Extended base level 3: x 50-470, y 560-640
      {
        leftX: 70,
        rightX: 450,
        topY: 580,
        bottomY: 620,
        windowWidth: 6,
        windowHeight: 12,
      },
      // Original base level: x 50-470, y 520-560
      {
        leftX: 70,
        rightX: 450,
        topY: 540,
        bottomY: 560,
        windowWidth: 6,
        windowHeight: 12,
      },
      // Level 2: x 70-450, y 480-520
      {
        leftX: 90,
        rightX: 430,
        topY: 490,
        bottomY: 510,
        windowWidth: 6,
        windowHeight: 9,
      },
      // Level 3: x 90-430, y 440-480
      {
        leftX: 110,
        rightX: 410,
        topY: 450,
        bottomY: 470,
        windowWidth: 6,
        windowHeight: 9,
      },
      // Level 4: x 110-410, y 400-440
      {
        leftX: 130,
        rightX: 390,
        topY: 410,
        bottomY: 430,
        windowWidth: 5,
        windowHeight: 9,
      },
      // Level 5: x 130-390, y 360-400
      {
        leftX: 150,
        rightX: 370,
        topY: 370,
        bottomY: 390,
        windowWidth: 5,
        windowHeight: 8,
      },
      // Level 6: x 150-370, y 320-360
      {
        leftX: 170,
        rightX: 350,
        topY: 330,
        bottomY: 350,
        windowWidth: 5,
        windowHeight: 8,
      },
      // Level 7: x 170-350, y 280-320
      {
        leftX: 190,
        rightX: 330,
        topY: 290,
        bottomY: 310,
        windowWidth: 4,
        windowHeight: 8,
      },
      // Level 8: x 190-330, y 240-280
      {
        leftX: 210,
        rightX: 310,
        topY: 250,
        bottomY: 270,
        windowWidth: 4,
        windowHeight: 6,
      },
      // Level 9: x 210-310, y 200-240
      {
        leftX: 230,
        rightX: 290,
        topY: 210,
        bottomY: 230,
        windowWidth: 3,
        windowHeight: 6,
      },
      // Level 10: x 230-290, y 160-200
      {
        leftX: 250,
        rightX: 270,
        topY: 170,
        bottomY: 190,
        windowWidth: 3,
        windowHeight: 6,
      },
    ]

    buildingTiers.forEach((tier) => {
      const tierWidth = tier.rightX - tier.leftX - 20 // Leave margins
      const tierHeight = tier.bottomY - tier.topY - 6

      const cols = Math.floor(tierWidth / (tier.windowWidth + 8))
      const rows = Math.floor(tierHeight / (tier.windowHeight + 3))

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          windows.push({
            x: tier.leftX + 10 + col * (tier.windowWidth + 8),
            y: tier.topY + 3 + row * (tier.windowHeight + 3),
            width: tier.windowWidth,
            height: tier.windowHeight,
          })
        }
      }
    })

    return windows
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-all duration-300"
      aria-hidden="true"
      style={{
        filter: `blur(${scrollBlur}px)`,
        opacity: scrollOpacity,
      }}
    >
      <svg
        className={`${hasTypedOnce ? 'sweep-active' : ''} ${
          prefersReducedMotion
            ? 'opacity-100 transition-opacity duration-0'
            : 'opacity-100'
        }`}
        width="100%"
        height="100%"
        viewBox="0 0 1200 1000"
        preserveAspectRatio="xMaxYEnd meet"
        role="img"
      >
        <title>Stylized skyscraper background</title>
        <defs>
          <linearGradient id="facade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f4f7fa" />
            <stop offset="100%" stopColor="#cfd9e3" />
          </linearGradient>
          <linearGradient id="neonGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="ethGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#627eea" />
            <stop offset="100%" stopColor="#4299e1" />
          </linearGradient>
          <linearGradient id="ethGradient2" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#4299e1" />
            <stop offset="100%" stopColor="#2d5aa0" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset in="blur" dx="0" dy="6" result="off" />
            <feColorMatrix
              in="off"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .25 0"
              result="shadow"
            />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur
              stdDeviation="3"
              in="SourceGraphic"
              result="glow1"
            />
            <feGaussianBlur
              stdDeviation="6"
              in="SourceGraphic"
              result="glow2"
            />
            <feGaussianBlur
              stdDeviation="12"
              in="SourceGraphic"
              result="glow3"
            />
            <feMerge>
              <feMergeNode in="glow3" />
              <feMergeNode in="glow2" />
              <feMergeNode in="glow1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="sweepGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="15%" stopColor="white" stopOpacity="0.9" />
            <stop offset="30%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="sweepMask">
            <rect
              id="sweepRect"
              x="-150"
              y="0"
              width="150"
              height="60"
              fill="url(#sweepGradient)"
            />
          </mask>
        </defs>

        {/* Floating clouds */}
        <g>
          {/* Cloud 1 - bounces left to right */}
          <g className="cloud-bounce-1">
            <ellipse cx="0" cy="0" rx="60" ry="25" fill="#e2e8f0" />
            <ellipse cx="35" cy="-8" rx="45" ry="20" fill="#f1f5f9" />
            <ellipse cx="-25" cy="-5" rx="35" ry="18" fill="#f8fafc" />
            <ellipse cx="15" cy="8" rx="40" ry="22" fill="#e2e8f0" />
          </g>

          {/* Cloud 2 - bounces right to left */}
          <g className="cloud-bounce-2">
            <ellipse cx="0" cy="0" rx="50" ry="20" fill="#e2e8f0" />
            <ellipse cx="25" cy="-6" rx="35" ry="16" fill="#f1f5f9" />
            <ellipse cx="-20" cy="-3" rx="30" ry="14" fill="#f8fafc" />
            <ellipse cx="10" cy="6" rx="35" ry="18" fill="#e2e8f0" />
          </g>

          {/* Cloud 3 - bounces left to right with different timing */}
          <g className="cloud-bounce-3">
            <ellipse cx="0" cy="0" rx="40" ry="18" fill="#e2e8f0" />
            <ellipse cx="20" cy="-5" rx="30" ry="14" fill="#f1f5f9" />
            <ellipse cx="-15" cy="-2" rx="25" ry="12" fill="#f8fafc" />
          </g>
        </g>

        <g transform="translate(670, 150)">
          <path
            ref={outlinePathRef}
            d="M50,800 L50,520 L70,520 L70,480 L90,480 L90,440 L110,440 L110,400 L130,400 L130,360 L150,360 L150,320 L170,320 L170,280 L190,280 L190,240 L210,240 L210,200 L230,200 L230,160 L250,160 L250,120 L270,120 L270,160 L290,160 L290,200 L310,200 L310,240 L330,240 L330,280 L350,280 L350,320 L370,320 L370,360 L390,360 L390,400 L410,400 L410,440 L430,440 L430,480 L450,480 L450,520 L470,520 L470,800 Z"
            fill="none"
            stroke="#2e3742"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: outlineLength,
              strokeDashoffset: prefersReducedMotion ? 0 : outlineLength,
            }}
            className={
              !prefersReducedMotion && outlineLength > 0 ? 'outline-draw' : ''
            }
          />

          <path
            d="M50,800 L50,520 L70,520 L70,480 L90,480 L90,440 L110,440 L110,400 L130,400 L130,360 L150,360 L150,320 L170,320 L170,280 L190,280 L190,240 L210,240 L210,200 L230,200 L230,160 L250,160 L250,120 L270,120 L270,160 L290,160 L290,200 L310,200 L310,240 L330,240 L330,280 L350,280 L350,320 L370,320 L370,360 L390,360 L390,400 L410,400 L410,440 L430,440 L430,480 L450,480 L450,520 L470,520 L470,800 Z"
            fill="url(#facade)"
            opacity={prefersReducedMotion ? 1 : 0}
            className={prefersReducedMotion ? '' : 'facade-fade'}
            filter="url(#softShadow)"
          />

          {windowGrid.map((window, index) => {
            const delayMs = prefersReducedMotion ? 0 : 1200 + (index % 100) * 20
            return (
              <rect
                key={`window-${index}`}
                x={window.x}
                y={window.y}
                width={window.width}
                height={window.height}
                fill="#2c3e50"
                stroke="#bdc3c7"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                rx="1"
                ry="1"
                opacity={prefersReducedMotion ? 1 : 0}
                className={prefersReducedMotion ? '' : 'window-appear'}
                style={{ animationDelay: `${delayMs}ms` }}
              />
            )
          })}

          {/* Empire State Building spire */}
          <g>
            <rect x="258" y="120" width="4" height="40" fill="#8b9dc3" />
            <rect x="257" y="100" width="6" height="20" fill="#9fadc6" />
            <rect x="256" y="80" width="8" height="20" fill="#b3c0d1" />
          </g>

          {showGlints && !prefersReducedMotion && (
            <g>
              {Array.from({ length: 8 }).map((_, i) => {
                const randomWindow =
                  windowGrid[Math.floor(Math.random() * windowGrid.length)]
                return (
                  <rect
                    key={`glint-${i}`}
                    x={randomWindow.x}
                    y={randomWindow.y}
                    width={randomWindow.width}
                    height={randomWindow.height}
                    fill="#ffffff"
                    opacity="0"
                    className="glint"
                    style={{
                      animationDelay: `${2000 + i * 500}ms`,
                    }}
                  />
                )
              })}
            </g>
          )}
        </g>
      </svg>

      <style jsx>{`
        :global(.neon-text) {
          animation: neonPulse 3s ease-in-out infinite;
          opacity: 0.9;
          filter: drop-shadow(0 0 8px rgba(192, 132, 252, 0.8))
            drop-shadow(0 0 16px rgba(244, 114, 182, 0.6))
            drop-shadow(0 0 24px rgba(192, 132, 252, 0.4));
        }
        :global(.neon-text-bright) {
          opacity: 1;
          filter: drop-shadow(0 0 12px rgba(192, 132, 252, 1))
            drop-shadow(0 0 24px rgba(244, 114, 182, 0.8))
            drop-shadow(0 0 36px rgba(192, 132, 252, 0.6));
        }
        .outline-draw {
          animation: outlineDraw 1.2s ease forwards;
        }
        @keyframes outlineDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .facade-fade {
          animation: facadeFade 0.8s ease forwards;
          animation-delay: 0.6s;
        }
        @keyframes facadeFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .window-appear {
          animation: windowAppear 0.3s ease forwards;
        }
        @keyframes windowAppear {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes neonPulse {
          0%,
          100% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
        }
        :global(.sweep-run) {
          mask: url(#sweepMask);
        }
        svg.sweep-active #sweepRect {
          animation: sweepAcross 0.9s ease-out 1 both;
        }
        @keyframes sweepAcross {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(240px);
          }
        }
        .glint {
          animation: glintFlash 0.7s ease-in-out 1 both;
        }
        @keyframes glintFlash {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        :global(.floating-eth-logo) {
          animation: floatUpDown 6s ease-in-out infinite !important;
        }
        .cloud-bounce-1 {
          animation: cloudBounce1 60s linear infinite;
          opacity: 0.3;
        }
        .cloud-bounce-2 {
          animation: cloudBounce2 80s linear infinite;
          opacity: 0.3;
        }
        .cloud-bounce-3 {
          animation: cloudBounce3 70s linear infinite;
          opacity: 0.3;
        }
        @keyframes floatUpDown {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
        @keyframes cloudBounce1 {
          0% {
            transform: translate(0px, 120px);
          }
          50% {
            transform: translate(1100px, 120px);
          }
          100% {
            transform: translate(0px, 120px);
          }
        }
        @keyframes cloudBounce2 {
          0% {
            transform: translate(1100px, 200px);
          }
          50% {
            transform: translate(0px, 200px);
          }
          100% {
            transform: translate(1100px, 200px);
          }
        }
        @keyframes cloudBounce3 {
          0% {
            transform: translate(0px, 80px);
          }
          50% {
            transform: translate(1100px, 80px);
          }
          100% {
            transform: translate(0px, 80px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .outline-draw,
          .facade-fade,
          .window-appear,
          svg #sweepRect,
          .glint,
          :global(.neon-text),
          .floating-eth-logo,
          .cloud-bounce-1,
          .cloud-bounce-2,
          .cloud-bounce-3 {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AnimatedSkyscraper
