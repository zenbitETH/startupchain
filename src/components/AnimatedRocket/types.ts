/**
 * TypeScript type definitions for AnimatedRocket component
 * Provides type safety and better developer experience
 */

/**
 * Animation state for the rocket component
 */
export interface AnimationState {
  /** Controls visibility and activation of all animation effects */
  showEffects: boolean
  /** Current scroll-based blur amount (0-15) */
  scrollBlur: number
  /** Current scroll-based opacity (0.3-1) */
  scrollOpacity: number
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean
}

/**
 * Scroll effect configuration
 */
export interface ScrollEffectConfig {
  /** Scroll position where effects start (pixels) */
  effectStart: number
  /** Scroll position where effects complete (pixels) */
  effectComplete: number
  /** Maximum blur amount */
  maxBlur: number
  /** Minimum opacity value */
  minOpacity: number
  /** Throttle delay in milliseconds */
  throttleDelay: number
}

/**
 * Animation timing configuration
 */
export interface AnimationTiming {
  /** Initial delay before animations start */
  initialDelay: number
  /** Individual animation durations */
  durations: {
    rocketHeat: number
    heatDistortion: number
    enginePulse: number
    speedLines: number
    transition: number
  }
}

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveConfig {
  /** Maximum width for mobile breakpoint */
  mobileMax: number
  /** Maximum width for tablet breakpoint */
  tabletMax: number
  /** ViewBox configurations for different screen sizes */
  viewbox: {
    mobile: string
    tablet: string
    desktop: string
  }
}

/**
 * Speed line configuration
 */
export interface SpeedLinesConfig {
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

/**
 * Rocket positioning configuration for different screen sizes
 */
export interface RocketPosition {
  mobile: string
  tablet: string
  desktop: string
}

/**
 * SVG gradient stop definition
 */
export interface GradientStop {
  offset: string
  stopColor: string
  stopOpacity?: string
}

/**
 * SVG linear gradient definition
 */
export interface LinearGradientDef {
  id: string
  x1: string
  x2: string
  y1: string
  y2: string
  stops: GradientStop[]
}

/**
 * SVG radial gradient definition
 */
export interface RadialGradientDef {
  id: string
  cx: string
  cy: string
  r: string
  stops: GradientStop[]
}

/**
 * SVG filter definition
 */
export interface FilterDef {
  id: string
  x: string
  y: string
  width: string
  height: string
}

/**
 * Props for the main AnimatedRocket component
 */
export interface AnimatedRocketProps {
  /** Company name to display (optional) */
  name?: string
  /** Additional CSS classes */
  className?: string
  /** Whether to start animations immediately */
  autoStart?: boolean
  /** Custom scroll effect configuration */
  scrollConfig?: Partial<ScrollEffectConfig>
  /** Custom animation timing */
  animationConfig?: Partial<AnimationTiming>
}

/**
 * Props for sub-components
 */
export interface RocketBodyProps {
  /** Whether effects are active */
  showEffects: boolean
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean
  /** Child components to render within the rocket transform group */
  children?: React.ReactNode
}

export interface SpeedLinesProps {
  /** Whether effects are active */
  showEffects: boolean
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean
  /** Configuration for speed lines */
  config: SpeedLinesConfig
}

export interface SVGDefsProps {
  /** Whether to include performance-heavy filters */
  includeFilters?: boolean
}

/**
 * Animation phase states
 */
export type AnimationPhase = 'idle' | 'starting' | 'active' | 'paused'

/**
 * Custom hook return types
 */
export interface UseScrollEffectReturn {
  scrollBlur: number
  scrollOpacity: number
  isScrolling: boolean
}

export interface UseReducedMotionReturn {
  prefersReducedMotion: boolean
  isLoaded: boolean
}

export type ScreenSize = 'mobile' | 'tablet' | 'desktop'

export interface UseResponsiveReturn {
  screenSize: ScreenSize
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  windowDimensions: {
    width: number
    height: number
  }
}

/**
 * Animation event handlers
 */
export interface AnimationEventHandlers {
  onAnimationStart?: () => void
  onAnimationEnd?: () => void
  onAnimationPause?: () => void
  onAnimationResume?: () => void
}

/**
 * Performance monitoring types
 */
export interface PerformanceMetrics {
  animationFrameRate: number
  scrollEventFrequency: number
  renderCount: number
  lastFrameTime: number
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Whether to respect prefers-reduced-motion */
  respectReducedMotion: boolean
  /** ARIA label for the rocket animation */
  ariaLabel?: string
  /** Whether the animation is decorative only */
  decorativeOnly: boolean
  /** Custom role for the SVG element */
  role?: string
}
