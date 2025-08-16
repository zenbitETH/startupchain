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

  // Scroll effect (blur, opacity, scale)
  useEffect(() => {
    const handleScroll = () => {
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
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Call once to set initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // One-time sweep activation on first non-empty name
  const nonEmpty = (name || '').trim().length > 0 && name !== DEFAULT_NAME
  useEffect(() => {
    if (nonEmpty && !prefersReducedMotion) setHasTypedOnce(true)
  }, [nonEmpty, prefersReducedMotion])

  // Only show text when user has typed something
  const displayName = nonEmpty ? name! : ''
  const signFontSize = useMemo(() => {
    const len = displayName.length
    if (len <= 12) return 26
    if (len <= 18) return 22
    if (len <= 26) return 18
    if (len <= 34) return 14
    return 12
  }, [displayName])

  const signTextFill = 'url(#neonGradient)'

  // Static randomized glint delays per mount
  const glintDelays = useMemo(() => {
    const delays: number[] = []
    for (let i = 0; i < 14; i += 1)
      delays.push(300 + Math.floor(Math.random() * 1000))
    return delays
  }, [])

  // Brick rows config
  const windowGrid = useMemo(() => {
    const windows: { x: number; y: number; width: number; height: number }[] =
      []
    const tiers = [
      { startX: 60, startY: 520, width: 380, endY: 600, windowSize: 8 },
      { startX: 80, startY: 480, width: 340, endY: 520, windowSize: 8 },
      { startX: 100, startY: 440, width: 300, endY: 480, windowSize: 7 },
      { startX: 120, startY: 400, width: 260, endY: 440, windowSize: 7 },
      { startX: 140, startY: 360, width: 220, endY: 400, windowSize: 6 },
      { startX: 160, startY: 320, width: 180, endY: 360, windowSize: 6 },
      { startX: 180, startY: 280, width: 140, endY: 320, windowSize: 5 },
      { startX: 200, startY: 240, width: 100, endY: 280, windowSize: 5 },
      { startX: 220, startY: 200, width: 80, endY: 240, windowSize: 4 },
      { startX: 240, startY: 160, width: 40, endY: 200, windowSize: 4 },
    ]

    tiers.forEach((tier) => {
      const cols = Math.floor(tier.width / (tier.windowSize + 3))
      const rows = Math.floor((tier.endY - tier.startY) / (tier.windowSize + 2))

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          windows.push({
            x: tier.startX + col * (tier.windowSize + 3),
            y: tier.startY + row * (tier.windowSize + 2),
            width: tier.windowSize,
            height: tier.windowSize,
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
        viewBox="0 0 1200 800"
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

        <g transform="translate(600, 150)">
          <path
            ref={outlinePathRef}
            d="M50,600 L50,520 L70,520 L70,480 L90,480 L90,440 L110,440 L110,400 L130,400 L130,360 L150,360 L150,320 L170,320 L170,280 L190,280 L190,240 L210,240 L210,200 L230,200 L230,160 L250,160 L250,120 L270,120 L270,160 L290,160 L290,200 L310,200 L310,240 L330,240 L330,280 L350,280 L350,320 L370,320 L370,360 L390,360 L390,400 L410,400 L410,440 L430,440 L430,480 L450,480 L450,520 L470,520 L470,600 Z"
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
            d="M50,600 L50,520 L70,520 L70,480 L90,480 L90,440 L110,440 L110,400 L130,400 L130,360 L150,360 L150,320 L170,320 L170,280 L190,280 L190,240 L210,240 L210,200 L230,200 L230,160 L250,160 L250,120 L270,120 L270,160 L290,160 L290,200 L310,200 L310,240 L330,240 L330,280 L350,280 L350,320 L370,320 L370,360 L390,360 L390,400 L410,400 L410,440 L430,440 L430,480 L450,480 L450,520 L470,520 L470,600 Z"
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
                fill="#2a3441"
                stroke="#4a5568"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                opacity={prefersReducedMotion ? 0.8 : 0}
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

          {showGlints && (
            <g>
              {Array.from({ length: 20 }).map((_, i) => {
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
                      animationDelay: `${2000 + Math.random() * 2000}ms`,
                    }}
                  />
                )
              })}
            </g>
          )}
        </g>
      </svg>

      {/* ETH Logo as separate element */}
      <Image
        src="/eth-logo.svg"
        alt="Ethereum Logo"
        className="floating-eth-logo"
        width={80}
        height={80}
        style={{
          position: 'fixed',
          top: '120px',
          right: '80px',
          width: '80px',
          height: '80px',
          opacity: 0.6,
          zIndex: 1,
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
          filter:
            'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)',
        }}
      />

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
            transform: scale(0.8);
          }
          to {
            opacity: 0.8;
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
          animation: floatUpDown 4s ease-in-out infinite !important;
        }
        .cloud-bounce-1 {
          animation: cloudBounce1 416s linear infinite;
          opacity: 0.3;
        }
        .cloud-bounce-2 {
          animation: cloudBounce2 624s linear infinite;
          opacity: 0.3;
        }
        .cloud-bounce-3 {
          animation: cloudBounce3 520s linear infinite;
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
        @keyframes cloudFloat {
          0%,
          100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(20px);
          }
        }
        @keyframes cloudFloatAtPosition {
          0%,
          100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(20px);
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
          .brick-row rect,
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
