'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

export type SkyscraperHeroProps = {
  initialName?: string
  ctaText?: string
  onSubmitEmail?: (email: string, name: string) => void
}

const DEFAULT_NAME = 'Your company'

export const SkyscraperHero: React.FC<SkyscraperHeroProps> = ({
  initialName = DEFAULT_NAME,
  ctaText = 'Start with just your email — we’ll handle the crypto magic',
  onSubmitEmail,
}) => {
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [hasTypedOnce, setHasTypedOnce] = useState<boolean>(false)
  const [showGlints, setShowGlints] = useState<boolean>(false)
  const outlinePathRef = useRef<SVGPathElement | null>(null)
  const [outlineLength, setOutlineLength] = useState<number>(0)

  // Accessibility: prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handle = () => setPrefersReducedMotion(media.matches)
    handle()
    media.addEventListener('change', handle)
    return () => media.removeEventListener('change', handle)
  }, [])

  // Compute outline path length for stroke-dash animation
  useEffect(() => {
    if (!outlinePathRef.current) return
    try {
      const length = outlinePathRef.current.getTotalLength()
      setOutlineLength(length)
    } catch {}
  }, [])

  // After outline draws and bricks animate, trigger one-time window glints
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowGlints(true)
      return
    }

    const totalMs = 1200 + 1200 // outline 1.2s + bricks <= 1.2s
    const timer = window.setTimeout(() => {
      setShowGlints(true)
    }, totalMs)
    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion])

  const displayName = name.trim().length > 0 ? name : initialName

  // Neon sign text sizing heuristic by length thresholds
  const signFontSize = useMemo(() => {
    const len = displayName.length
    if (len <= 12) return 26
    if (len <= 18) return 22
    if (len <= 26) return 18
    if (len <= 34) return 14
    return 12
  }, [displayName])

  const handleNameChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value
    setName(value)
    if (!hasTypedOnce && value.trim().length > 0) setHasTypedOnce(true)
  }

  const handleEmailChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setEmail(e.target.value)
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    if (onSubmitEmail) onSubmitEmail(email, displayName)
  }

  // Windows glints delays (randomized but static per mount)
  const glintDelays = useMemo(() => {
    const delays: number[] = []
    for (let i = 0; i < 14; i += 1) {
      delays.push(300 + Math.floor(Math.random() * 1000))
    }
    return delays
  }, [])

  // Brick rows config (lower count to keep DOM small)
  const brickRows = useMemo(() => {
    const rows: { y: number; count: number; width: number; height: number }[] =
      []
    const startY = 250
    const rowHeight = 10
    const numRows = 14
    for (let i = 0; i < numRows; i += 1) {
      rows.push({
        y: startY - i * (rowHeight + 3),
        count: 6,
        width: 22,
        height: 10,
      })
    }
    return rows
  }, [])

  const signTextFill = 'url(#neonGradient)'

  return (
    <section
      className="relative isolate flex min-h-[calc(100vh-4rem)] w-full items-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* Vignette + radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(124,58,237,0.25),transparent_60%),radial-gradient(40%_30%_at_80%_80%,rgba(236,72,153,0.20),transparent_55%),radial-gradient(35%_30%_at_20%_80%,rgba(139,92,246,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_100%)] mix-blend-multiply" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            Build your business
            <br />
            <span className="from-primary via-accent to-primary animate-gradient-x bg-gradient-to-r bg-clip-text text-transparent">
              on-chain forever
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
            Register ENS names, split revenue transparently, and build with the
            security of blockchain technology.
          </p>

          {/* CTA card */}
          <form
            onSubmit={handleSubmit}
            className="border-border/60 bg-card/50 mx-auto mb-14 w-full max-w-2xl rounded-2xl border p-4 shadow-2xl backdrop-blur-sm"
            aria-label="Name and email capture form"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="relative">
                <label htmlFor="companyName" className="sr-only">
                  Company name
                </label>
                <input
                  id="companyName"
                  aria-label="Company name"
                  aria-describedby="companyNameHelp"
                  type="text"
                  inputMode="text"
                  placeholder="Your company name"
                  value={name}
                  onChange={handleNameChange}
                  className="border-border bg-background focus:border-primary focus:ring-primary/40 w-full rounded-xl border px-5 py-4 pr-16 text-base transition outline-none focus:ring-2"
                />
                <div className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 select-none">
                  .eth
                </div>
                <p
                  id="companyNameHelp"
                  className="text-muted-foreground mt-2 text-xs"
                >
                  This will appear on the neon sign above the building
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  aria-label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  className="border-border bg-background focus:border-primary focus:ring-primary/40 w-full rounded-xl border px-5 py-4 text-base transition outline-none focus:ring-2"
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary rounded-xl px-6 py-4 text-sm font-semibold shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ctaText}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* SVG skyscraper background */}
      <div
        className="pointer-events-none absolute inset-x-0 top-20 bottom-0 -z-0 flex items-end justify-center"
        aria-hidden="true"
      >
        <svg
          className={`${hasTypedOnce ? 'sweep-active' : ''} ${
            prefersReducedMotion
              ? 'opacity-100 transition-opacity duration-0'
              : 'opacity-100'
          }`}
          width="100%"
          height="100%"
          viewBox="0 0 480 360"
          preserveAspectRatio="xMidYMax meet"
          role="img"
        >
          <title>Stylized skyscraper background</title>
          <defs>
            {/* Building gradient */}
            <linearGradient id="facade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f4f7fa" />
              <stop offset="100%" stopColor="#cfd9e3" />
            </linearGradient>

            {/* Neon gradient for text fill */}
            <linearGradient id="neonGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>

            {/* Drop shadow filter */}
            <filter
              id="softShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
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

            {/* Neon sign glow filter per spec */}
            <filter id="neon">
              <feMorphology
                operator="dilate"
                radius="0.3"
                in="SourceAlpha"
                result="thick"
              />
              <feGaussianBlur stdDeviation="2" in="thick" result="blurred" />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* One-time sweep mask */}
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

          {/* Ground shadow */}
          <ellipse
            cx="240"
            cy="350"
            rx="180"
            ry="18"
            fill="rgba(0,0,0,0.35)"
            filter="url(#softShadow)"
          />

          {/* Building group */}
          <g transform="translate(120, 30)">
            {/* Outline silhouette path (Empire State inspired) */}
            <path
              ref={outlinePathRef}
              d="M120,270 L120,200 L105,200 L105,190 L130,190 L130,180 L115,180 L115,170 L140,170 L140,150 L130,150 L130,140 L150,140 L150,120 L145,120 L145,110 L155,110 L155,80 L150,80 L150,60 L160,60 L160,40 L165,40 L165,30 L170,30 L170,40 L175,40 L175,60 L185,60 L185,80 L180,80 L180,110 L190,110 L190,120 L185,120 L185,140 L200,140 L200,150 L190,150 L190,170 L215,170 L215,180 L200,180 L200,190 L225,190 L225,200 L210,200 L210,270 Z"
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

            {/* Facade fill with fade-in */}
            <path
              d="M120,270 L120,200 L105,200 L105,190 L130,190 L130,180 L115,180 L115,170 L140,170 L140,150 L130,150 L130,140 L150,140 L150,120 L145,120 L145,110 L155,110 L155,80 L150,80 L150,60 L160,60 L160,40 L165,40 L165,30 L170,30 L170,40 L175,40 L175,60 L185,60 L185,80 L180,80 L180,110 L190,110 L190,120 L185,120 L185,140 L200,140 L200,150 L190,150 L190,170 L215,170 L215,180 L200,180 L200,190 L225,190 L225,200 L210,200 L210,270 Z"
              fill="url(#facade)"
              opacity={prefersReducedMotion ? 1 : 0}
              className={prefersReducedMotion ? '' : 'facade-fade'}
              filter="url(#softShadow)"
            />

            {/* Brick rows (staggered) */}
            {brickRows.map((row, rowIndex) => {
              const startX = 126
              const gap = 6
              const bricks = Array.from({ length: row.count })
              const delayMs = prefersReducedMotion ? 0 : 120 + rowIndex * 60
              return (
                <g
                  key={`row-${rowIndex}`}
                  className={prefersReducedMotion ? '' : 'brick-row'}
                  style={{ animationDelay: `${delayMs}ms` }}
                >
                  {bricks.map((_, i) => (
                    <rect
                      key={`row-${rowIndex}-b-${i}`}
                      x={startX + i * (row.width + gap)}
                      y={row.y}
                      width={row.width}
                      height={row.height}
                      fill="#e6ebf1"
                      stroke="#d1d9e3"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      opacity={prefersReducedMotion ? 1 : 0}
                    />
                  ))}
                </g>
              )
            })}

            {/* Neon sign near top */}
            <g transform="translate(150, 95)">
              <rect
                x="-30"
                y="-16"
                width="120"
                height="36"
                rx="8"
                ry="8"
                fill="rgba(20,25,35,0.9)"
                stroke="#2e3742"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />

              {/* Neon text with pulse */}
              <g filter="url(#neon)">
                <text
                  x="30"
                  y="6"
                  fontSize={signFontSize}
                  fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={signTextFill}
                  className={
                    hasTypedOnce && !prefersReducedMotion
                      ? 'neon-text neon-text-bright'
                      : 'neon-text'
                  }
                >
                  {displayName}
                </text>

                {/* One-time sweep effect overlay */}
                {hasTypedOnce && !prefersReducedMotion && (
                  <g mask="url(#sweepMask)">
                    <text
                      x="30"
                      y="6"
                      fontSize={signFontSize}
                      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      opacity="0.9"
                      className="sweep-run"
                    >
                      {displayName}
                    </text>
                  </g>
                )}
              </g>
            </g>

            {/* Windows glints */}
            {showGlints && (
              <g>
                {Array.from({ length: glintDelays.length }).map((_, i) => (
                  <rect
                    key={`glint-${i}`}
                    x={135 + ((i * 27) % 150)}
                    y={205 - Math.floor(i / 5) * 22}
                    width="8"
                    height="6"
                    fill="#ffffff"
                    opacity="0"
                    className="glint"
                    style={{ animationDelay: `${glintDelays[i]}ms` }}
                  />
                ))}
              </g>
            )}

            {/* Small antenna at top */}
            <g>
              <rect x="167" y="22" width="2" height="10" fill="#2e3742" />
              <circle cx="168" cy="20" r="2" fill="#c084fc" />
            </g>
          </g>
        </svg>
      </div>

      {/* Inline styles for animations and effects */}
      <style jsx>{`
        :global(.neon-text) {
          animation: neonPulse 3s ease-in-out infinite;
          opacity: 0.9;
        }
        :global(.neon-text-bright) {
          opacity: 1;
        }

        /* Outline draw */
        .outline-draw {
          animation: outlineDraw 1.2s ease forwards;
        }
        @keyframes outlineDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Facade fade-in */
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

        /* Brick rows staggered */
        .brick-row rect {
          transform: translateY(6px);
          animation: brickAppear 0.42s ease forwards;
        }
        .brick-row rect:nth-child(odd) {
          animation-duration: 0.36s;
        }
        @keyframes brickAppear {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Neon pulse */
        @keyframes neonPulse {
          0%,
          100% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
        }

        /* One-time sweep: trigger only after first keystroke */
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

        /* Windows glint */
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

        /* Reduced motion: override animations */
        @media (prefers-reduced-motion: reduce) {
          .outline-draw,
          .facade-fade,
          .brick-row rect,
          svg #sweepRect,
          .glint,
          :global(.neon-text) {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  )
}

export default SkyscraperHero
