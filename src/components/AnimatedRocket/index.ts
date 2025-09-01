/**
 * AnimatedRocket Component Export
 * 
 * Main exports for the AnimatedRocket component system.
 * Use this file to import the AnimatedRocket component and related types.
 */

// Main component
export { AnimatedRocket } from '../AnimatedRocket'

// Component parts (for advanced usage)
export { RocketBody } from './RocketBody'
export { RocketNose } from './RocketNose'  
export { SpeedLines } from './SpeedLines'
export { SVGDefs } from './SVGDefs'

// Hooks (for custom implementations)
export {
  useScrollEffect,
  useReducedMotion,
  useResponsive,
  useAnimationLifecycle,
  usePerformanceMonitor,
} from './hooks'

// Types (for TypeScript users)
export type {
  AnimatedRocketProps,
  AnimationState,
  ScrollEffectConfig,
  AnimationTiming,
  ResponsiveConfig,
  SpeedLinesConfig,
  RocketPosition,
  RocketBodyProps,
  SpeedLinesProps,
  SVGDefsProps,
  ScreenSize,
  AnimationPhase,
  UseScrollEffectReturn,
  UseReducedMotionReturn,
  UseResponsiveReturn,
  AccessibilityConfig,
} from './types'

// Constants (for customization)
export {
  ANIMATION_CONFIG,
  RESPONSIVE_CONFIG,
  GRADIENT_DEFINITIONS,
  FILTER_DEFINITIONS,
  ROCKET_BODY_PATH,
  ROCKET_NOSE_PATH,
} from './constants'