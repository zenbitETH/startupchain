'use client'

import React, { useEffect, useRef, useState } from 'react'

export type AnimatedRocketProps = {
  name?: string
}

const DEFAULT_NAME = 'Your company'

export const AnimatedRocket: React.FC<AnimatedRocketProps> = ({
  name = DEFAULT_NAME,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [scrollBlur, setScrollBlur] = useState<number>(0)
  const [scrollOpacity, setScrollOpacity] = useState<number>(1)
  const [showEffects, setShowEffects] = useState<boolean>(false)

  // Detect reduced motion
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handle = () => setPrefersReducedMotion(media.matches)
    handle()
    media.addEventListener('change', handle)
    return () => media.removeEventListener('change', handle)
  }, [])

  // Trigger effects after initial delay
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowEffects(true)
      return
    }
    const timer = window.setTimeout(() => setShowEffects(true), 800)
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
        className={`${showEffects ? 'effects-active' : ''} ${
          prefersReducedMotion
            ? 'opacity-100 transition-opacity duration-0'
            : 'opacity-100'
        }`}
        width="100%"
        height="100%"
        viewBox="0 0 1200 1000"
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <title>Animated rocket background</title>
        <defs>
          {/* Rocket body gradient */}
          <linearGradient id="rocketBody" x1="0.357103" x2="0.730859" y1="0" y2="1">
            <stop offset="0%" stopColor="#46B5D1" />
            <stop offset="100%" stopColor="#CE6449" />
          </linearGradient>
          
          {/* Rocket nose gradient */}
          <linearGradient id="rocketNose" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#46B5D1" />
            <stop offset="100%" stopColor="#3A9BB8" />
          </linearGradient>

          {/* Speed lines gradient */}
          <linearGradient id="speedLines" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Engine glow */}
          <radialGradient id="engineGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#FF6B35" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
          </radialGradient>

  
          {/* Glow filter for speed effects */}
          <filter id="speedGlow" x="-50%" y="-50%" width="200%" height="200%">
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

          {/* Particle system for engine exhaust */}
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Background stars - fixed positions with individual twinkle animations */}
        <g className="stars">
          {Array.from({ length: 150 }).map((_, i) => (
            <circle
              key={`star-${i}`}
              cx={Math.random() * 1200}
              cy={Math.random() * 1000}
              r={Math.random() * 2 + 0.5}
              fill="#ffffff"
              opacity="0.6"
              className="star"
              style={{ animationDelay: `${Math.random() * 5}s` }}
            />
          ))}
        </g>

        {/* Speed lines effect - diagonal lines parallel to rocket trajectory */}
        <g className="speed-lines">
          {Array.from({ length: 15 }).map((_, i) => (
            <line
              key={`speed-${i}`}
              x1={1000 + i * 40}
              y1={150 + i * 30}
              x2={900 + i * 40}
              y2={250 + i * 30}
              stroke="url(#speedLines)"
              strokeWidth="3"
              opacity="0"
              className="speed-line"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </g>
 

        {/* Main rocket positioned on the right side */}
        <g transform="translate(800, 200) scale(0.8)">
          {/* Rocket body (lower orange section) with heat effects */}
          <g className="rocket-body">
            <path
              d="M434.331 578.979C427.24 586.585 420.474 593.961 413.552 601.181C404.327 610.804 395.167 620.506 385.644 629.815C370.473 644.646 355.498 659.744 339.559 673.679C324.135 687.164 305.961 696.241 286.063 700.553C268.034 704.461 249.973 705.052 231.51 700.65C213.979 696.47 197.665 690.291 182.984 679.876C160.469 663.904 142.957 643.622 132.67 617.313C130.367 611.423 126.988 605.876 125.394 599.817C123.492 592.586 122.067 584.977 122.052 577.527C122.02 562.115 121.96 546.551 123.96 531.329C126.008 515.747 131.565 500.924 138.999 486.925C146.173 473.415 154.885 461.285 165.841 450.658C174.939 441.834 183.06 431.965 192.094 423.068C206.377 409.003 220.933 395.217 235.637 381.611C242.074 375.653 248.627 369.473 256.089 365.109C265.772 359.447 276.108 354.534 286.708 351.006C309.644 343.371 333.497 342.985 357.343 344.317C362.103 344.583 364.825 342.514 367.594 339.199C376.926 328.024 386.21 316.796 395.906 305.955C404.366 296.497 413.004 287.142 422.231 278.483C429.228 271.916 436.908 265.92 444.947 260.744C455.405 254.011 466.241 247.736 477.424 242.372C490.233 236.228 503.436 230.822 516.777 225.986C528.616 221.695 540.857 218.547 552.969 215.074C555.776 214.27 558.772 214.041 561.701 213.825C564.993 213.582 567.174 217.784 566.507 222.243C564.519 235.535 562.97 248.904 560.62 262.127C559.185 270.202 557.093 278.245 554.405 285.981C550.087 298.408 545.429 310.75 540.154 322.782C536.269 331.641 531.738 340.33 526.485 348.411C518.083 361.335 509.411 374.167 499.793 386.151C490.694 397.488 480.706 408.21 470.166 418.16C464.814 423.212 463.98 428.081 464.945 434.613C465.68 439.584 465.82 444.688 465.782 449.73C465.677 463.822 465.89 477.949 464.966 491.993C463.665 511.751 459.336 530.981 450.953 548.919C446.165 559.164 440.086 568.78 434.331 578.979ZM322.367 533.019C310.766 540.687 299.644 549.302 287.426 555.751C275.789 561.893 263.061 565.918 250.703 570.57C246.422 572.182 243.312 569.007 244.634 564.736C248.636 551.807 251.749 538.454 257.143 526.149C262.558 513.798 269.033 501.454 277.355 491.03C286.804 479.194 298.817 469.492 309.537 459.035C307.87 457.644 304.893 455.811 302.856 453.212C301.64 451.66 300.898 448.431 301.655 446.767C306.532 436.041 311.889 425.541 317.073 414.959C318.101 412.861 319.058 410.727 320.705 407.202C310.671 408.146 301.995 408.435 293.513 409.899C283.771 411.581 276.44 418.06 269.559 424.853C247.219 446.91 224.902 468.991 202.663 491.154C193.325 500.461 186.473 511.81 182.136 524.063C176.111 541.084 174.066 558.737 177.376 577.12C181.451 599.751 191.79 618.307 209.799 631.497C225.839 643.245 244.287 648.424 264.434 645.946C276.764 644.43 288.255 640.67 298.241 633.245C304.597 628.518 310.261 622.774 315.982 617.214C326.424 607.064 336.638 596.669 347.023 586.456C357.61 576.042 368.396 565.837 378.88 555.317C384.098 550.079 389.316 544.709 393.689 538.752C403.193 525.806 404.834 510.651 403.659 495.096C403.268 489.93 401.654 484.861 400.598 479.742C397.153 481.698 394.658 482.848 392.447 484.417C383.144 491.019 373.983 497.832 364.65 504.389C360.559 507.263 356.458 507.652 353.044 502.99C351.554 500.955 349.896 499.049 348.744 497.618C342.026 507.25 335.783 516.348 329.361 525.313C327.498 527.913 325.121 530.129 322.367 533.019Z"
              fill="url(#rocketBody)"
              className="rocket-body-path"
            />
            
            {/* Heat distortion overlay */}
            <path
              d="M434.331 578.979C427.24 586.585 420.474 593.961 413.552 601.181C404.327 610.804 395.167 620.506 385.644 629.815C370.473 644.646 355.498 659.744 339.559 673.679C324.135 687.164 305.961 696.241 286.063 700.553C268.034 704.461 249.973 705.052 231.51 700.65C213.979 696.47 197.665 690.291 182.984 679.876C160.469 663.904 142.957 643.622 132.67 617.313C130.367 611.423 126.988 605.876 125.394 599.817C123.492 592.586 122.067 584.977 122.052 577.527C122.02 562.115 121.96 546.551 123.96 531.329C126.008 515.747 131.565 500.924 138.999 486.925C146.173 473.415 154.885 461.285 165.841 450.658C174.939 441.834 183.06 431.965 192.094 423.068C206.377 409.003 220.933 395.217 235.637 381.611C242.074 375.653 248.627 369.473 256.089 365.109C265.772 359.447 276.108 354.534 286.708 351.006C309.644 343.371 333.497 342.985 357.343 344.317C362.103 344.583 364.825 342.514 367.594 339.199C376.926 328.024 386.21 316.796 395.906 305.955C404.366 296.497 413.004 287.142 422.231 278.483C429.228 271.916 436.908 265.92 444.947 260.744C455.405 254.011 466.241 247.736 477.424 242.372C490.233 236.228 503.436 230.822 516.777 225.986C528.616 221.695 540.857 218.547 552.969 215.074C555.776 214.27 558.772 214.041 561.701 213.825C564.993 213.582 567.174 217.784 566.507 222.243C564.519 235.535 562.97 248.904 560.62 262.127C559.185 270.202 557.093 278.245 554.405 285.981C550.087 298.408 545.429 310.75 540.154 322.782C536.269 331.641 531.738 340.33 526.485 348.411C518.083 361.335 509.411 374.167 499.793 386.151C490.694 397.488 480.706 408.21 470.166 418.16C464.814 423.212 463.98 428.081 464.945 434.613C465.68 439.584 465.82 444.688 465.782 449.73C465.677 463.822 465.89 477.949 464.966 491.993C463.665 511.751 459.336 530.981 450.953 548.919C446.165 559.164 440.086 568.78 434.331 578.979ZM322.367 533.019C310.766 540.687 299.644 549.302 287.426 555.751C275.789 561.893 263.061 565.918 250.703 570.57C246.422 572.182 243.312 569.007 244.634 564.736C248.636 551.807 251.749 538.454 257.143 526.149C262.558 513.798 269.033 501.454 277.355 491.03C286.804 479.194 298.817 469.492 309.537 459.035C307.87 457.644 304.893 455.811 302.856 453.212C301.64 451.66 300.898 448.431 301.655 446.767C306.532 436.041 311.889 425.541 317.073 414.959C318.101 412.861 319.058 410.727 320.705 407.202C310.671 408.146 301.995 408.435 293.513 409.899C283.771 411.581 276.44 418.06 269.559 424.853C247.219 446.91 224.902 468.991 202.663 491.154C193.325 500.461 186.473 511.81 182.136 524.063C176.111 541.084 174.066 558.737 177.376 577.12C181.451 599.751 191.79 618.307 209.799 631.497C225.839 643.245 244.287 648.424 264.434 645.946C276.764 644.43 288.255 640.67 298.241 633.245C304.597 628.518 310.261 622.774 315.982 617.214C326.424 607.064 336.638 596.669 347.023 586.456C357.61 576.042 368.396 565.837 378.88 555.317C384.098 550.079 389.316 544.709 393.689 538.752C403.193 525.806 404.834 510.651 403.659 495.096C403.268 489.93 401.654 484.861 400.598 479.742C397.153 481.698 394.658 482.848 392.447 484.417C383.144 491.019 373.983 497.832 364.65 504.389C360.559 507.263 356.458 507.652 353.044 502.99C351.554 500.955 349.896 499.049 348.744 497.618C342.026 507.25 335.783 516.348 329.361 525.313C327.498 527.913 325.121 530.129 322.367 533.019Z"
              fill="url(#engineGlow)"
              opacity="0.3"
              className="heat-overlay"
              filter="url(#heatDistortion)"
            />
          </g>

          {/* Rocket nose (upper blue section) */}
          <path
            d="M389.721 175.907C399.725 165.566 409.298 155.287 419.232 145.402C428.997 135.684 438.323 125.16 449.31 117.191C461.909 108.052 476.03 101.262 491.11 96.9134C508.105 92.0129 525.296 89.9919 542.811 91.4789C563.24 93.2132 582.759 98.6636 600.905 108.755C622.385 120.7 640.15 137.105 654.082 157.969C664.307 173.281 671.371 190.172 675.787 208.124C677.911 216.759 678.446 225.852 679.338 234.777C680.838 249.806 679.477 264.794 676.169 279.348C672.894 293.757 667.74 307.63 660 320.274C644.973 344.82 623.749 363.512 604.575 384.131C594.194 395.293 583.555 406.195 572.978 417.156C562.765 427.74 552.869 438.705 542.122 448.667C531.194 458.797 517.834 464.976 504.202 470.168C499.297 472.036 493.972 472.833 488.776 473.715C480.824 475.064 479.664 473.818 479.959 465.492C480.303 455.757 480.689 446.021 480.833 436.283C480.884 432.844 480.109 429.399 480.014 425.948C479.907 422.051 482.076 420.27 485.55 418.796C494.27 415.097 503.554 411.934 511.077 406.32C519.461 400.063 526.236 391.423 533.558 383.663C543.915 372.684 554.012 361.435 564.442 350.531C575.515 338.954 586.727 327.514 598.093 316.25C614.117 300.371 624.011 281.159 627.838 258.5C627.896 258.158 627.911 257.804 627.907 257.456C627.734 242.625 628.89 227.803 624.043 213.258C615.033 186.225 599.137 165.6 574.391 152.922C557.836 144.441 540.319 142.016 521.881 143.76C502.158 145.626 485.297 153.94 470.396 166.674C461.53 174.251 453.854 183.339 445.617 191.719C437.672 199.802 429.594 207.745 421.755 215.936C411.488 226.665 401.187 237.373 391.31 248.485C385.24 255.315 379.2 262.399 374.454 270.231C366.784 282.889 366.542 297.408 367.162 311.919C367.559 321.199 366.419 321.903 357.487 322.772C346.508 323.841 335.585 325.566 324.652 327.111C321.111 327.612 318.008 325.025 317.867 320.01C317.56 309.119 316.643 298.051 318.066 287.357C319.519 276.432 323.029 265.713 326.438 255.185C331.241 240.353 340.544 228.412 350.79 217.265C361.28 205.851 371.834 194.499 382.399 183.16C384.662 180.732 387.094 178.476 389.721 175.907Z"
            fill="url(#rocketNose)"
            className="rocket-nose"
          />
        </g>
      </svg>

      <style jsx>{`
        .effects-active .rocket-body-path {
          animation: rocketHeat 2s ease-in-out infinite;
        }
        
        .effects-active .heat-overlay {
          animation: heatDistortion 3s ease-in-out infinite;
        }
        
        .effects-active .engine-glow {
          animation: enginePulse 1.5s ease-in-out infinite;
        }
        
        .effects-active .speed-line {
          animation: speedLineMove 2s linear infinite;
        }
        

        
        .effects-active .star {
          animation: starTwinkle 3s ease-in-out infinite;
        }

        @keyframes rocketHeat {
          0%, 100% {
            filter: brightness(1) saturate(1);
          }
          50% {
            filter: brightness(1.2) saturate(1.3);
          }
        }
        
        @keyframes heatDistortion {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
        }
        
        @keyframes enginePulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.1);
          }
        }
        
        @keyframes speedLineMove {
          0% {
            opacity: 0;
            transform: translate(0, 0);
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-300px, 200px);
          }
        }
        

        
        @keyframes starTwinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rocket-body-path,
          .heat-overlay,
          .engine-glow,
          .speed-line,
          .star {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AnimatedRocket
