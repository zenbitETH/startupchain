'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { 
  UseScrollEffectReturn, 
  UseReducedMotionReturn, 
  UseResponsiveReturn,
  ScrollEffectConfig,
  ScreenSize 
} from './types';
import { ANIMATION_CONFIG, RESPONSIVE_CONFIG } from './constants';

/**
 * Custom hook for managing scroll-based animation effects
 * Optimized with throttling and requestAnimationFrame for 60fps performance
 */
export function useScrollEffect(config: Partial<ScrollEffectConfig> = {}): UseScrollEffectReturn {
  const [scrollBlur, setScrollBlur] = useState<number>(0);
  const [scrollOpacity, setScrollOpacity] = useState<number>(1);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect mobile for different scroll thresholds
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= RESPONSIVE_CONFIG.MOBILE_MAX);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Use mobile thresholds if on mobile, otherwise use desktop
  const scrollConfig = isMobile ? ANIMATION_CONFIG.SCROLL.MOBILE : ANIMATION_CONFIG.SCROLL;
  
  // Store config in refs to avoid re-creating the effect
  const effectStart = config.effectStart ?? scrollConfig.EFFECT_START;
  const effectComplete = config.effectComplete ?? scrollConfig.EFFECT_COMPLETE;
  const maxBlur = config.maxBlur ?? scrollConfig.MAX_BLUR;
  const minOpacity = config.minOpacity ?? scrollConfig.MIN_OPACITY;

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollY = 0;
    
    const updateScrollEffects = (scrollY: number) => {
      if (scrollY <= effectStart) {
        setScrollBlur(0);
        setScrollOpacity(1);
      } else if (scrollY >= effectComplete) {
        setScrollBlur(maxBlur);
        setScrollOpacity(minOpacity);
      } else {
        const progress = (scrollY - effectStart) / (effectComplete - effectStart);
        
        // Use easing function for smoother transitions
        const easedProgress = progress * progress * (3.0 - 2.0 * progress); // smoothstep
        
        const newBlur = easedProgress * maxBlur;
        const newOpacity = 1 - easedProgress * (1 - minOpacity);
        
        setScrollBlur(newBlur);
        setScrollOpacity(newOpacity);
      }
    };
    
    const handleScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        // Always update, remove the threshold check for now
        updateScrollEffects(scrollY);
        lastScrollY = scrollY;
        
        setIsScrolling(true);
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to detect scroll end
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
        
        rafId = null;
      });
    };
    
    // Set initial state
    updateScrollEffects(window.scrollY);
    
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [effectStart, effectComplete, maxBlur, minOpacity]);

  return { scrollBlur, scrollOpacity, isScrolling };
}

/**
 * Custom hook for detecting user's reduced motion preference
 * Includes initial loading state for proper SSR handling
 */
export function useReducedMotion(): UseReducedMotionReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
      setIsLoaded(true);
    };
    
    // Set initial state
    handleChange(mediaQuery);
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return { prefersReducedMotion, isLoaded };
}

/**
 * Custom hook for responsive design breakpoints
 * Provides current screen size and window dimensions
 */
export function useResponsive(): UseResponsiveReturn {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [windowDimensions, setWindowDimensions] = useState({
    width: 1200,
    height: 800,
  });

  const updateScreenSize = useCallback((width: number) => {
    if (width <= RESPONSIVE_CONFIG.MOBILE_MAX) {
      setScreenSize('mobile');
    } else if (width <= RESPONSIVE_CONFIG.TABLET_MAX) {
      setScreenSize('tablet');
    } else {
      setScreenSize('desktop');
    }
  }, []);

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const { innerWidth, innerHeight } = window;
    setWindowDimensions({ width: innerWidth, height: innerHeight });
    updateScreenSize(innerWidth);
  }, [updateScreenSize]);

  useEffect(() => {
    // Set initial state
    handleResize();
    
    // Use throttled resize listener for better performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', throttledResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet', 
    isDesktop: screenSize === 'desktop',
    windowDimensions,
  };
}

/**
 * Custom hook for managing animation lifecycle with proper cleanup
 */
export function useAnimationLifecycle(
  autoStart: boolean = true,
  initialDelay: number = ANIMATION_CONFIG.INITIAL_DELAY
) {
  const [showEffects, setShowEffects] = useState<boolean>(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'starting' | 'active' | 'paused'>('idle');
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const startAnimations = useCallback(() => {
    if (!autoStart) return;
    
    setAnimationPhase('starting');
    
    timeoutRef.current = setTimeout(() => {
      setShowEffects(true);
      setAnimationPhase('active');
    }, initialDelay);
  }, [autoStart, initialDelay]);
  
  const pauseAnimations = useCallback(() => {
    setAnimationPhase('paused');
    // Note: CSS animations will be paused via classes
  }, []);
  
  const resumeAnimations = useCallback(() => {
    setAnimationPhase('active');
  }, []);
  
  const resetAnimations = useCallback(() => {
    setShowEffects(false);
    setAnimationPhase('idle');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAnimations();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startAnimations]);

  return {
    showEffects,
    animationPhase,
    startAnimations,
    pauseAnimations,
    resumeAnimations,
    resetAnimations,
  };
}

/**
 * Custom hook for performance monitoring (development only)
 */
export function usePerformanceMonitor(enabled: boolean = process.env.NODE_ENV === 'development') {
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());
  const [fps, setFps] = useState<number>(60);
  
  useEffect(() => {
    if (!enabled) return;
    
    let animationId: number;
    
    const measureFPS = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTime.current;
      
      frameCount.current++;
      
      // Update FPS every second
      if (delta >= 1000) {
        const currentFPS = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFPS);
        
        frameCount.current = 0;
        lastTime.current = currentTime;
        
        // Log performance warnings in development
        if (currentFPS < 50) {
          console.warn(`AnimatedRocket: Low FPS detected (${currentFPS}fps)`);
        }
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);
  
  return { fps };
}