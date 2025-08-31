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
  const rafRef = useRef<number | null>(null);
  const lastScrollY = useRef<number>(0);
  
  const effectConfig = {
    effectStart: config.effectStart ?? ANIMATION_CONFIG.SCROLL.EFFECT_START,
    effectComplete: config.effectComplete ?? ANIMATION_CONFIG.SCROLL.EFFECT_COMPLETE,
    maxBlur: config.maxBlur ?? ANIMATION_CONFIG.SCROLL.MAX_BLUR,
    minOpacity: config.minOpacity ?? ANIMATION_CONFIG.SCROLL.MIN_OPACITY,
    throttleDelay: config.throttleDelay ?? ANIMATION_CONFIG.THROTTLE_DELAY,
  };

  const updateScrollEffects = useCallback((scrollY: number) => {
    const { effectStart, effectComplete, maxBlur, minOpacity } = effectConfig;
    
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
      
      setScrollBlur(easedProgress * maxBlur);
      setScrollOpacity(1 - easedProgress * (1 - minOpacity));
    }
  }, [effectConfig]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return; // Already scheduled
    
    rafRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      
      // Only update if scroll position changed significantly
      if (Math.abs(scrollY - lastScrollY.current) > 1) {
        updateScrollEffects(scrollY);
        lastScrollY.current = scrollY;
        
        setIsScrolling(true);
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to detect scroll end
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      }
      
      rafRef.current = null;
    });
  }, [updateScrollEffects]);

  useEffect(() => {
    // Set initial state
    handleScroll();
    
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

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