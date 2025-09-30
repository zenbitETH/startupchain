'use client'

import { useCallback, useEffect } from 'react'

export function ScrollEffect() {
  const handleScroll = useCallback(() => {
    const element = document.getElementById('rocket-group')
    const svgElement = element?.closest('svg')
    if (!element || !svgElement) return

    const scrollY = window.scrollY
    const windowHeight = window.innerHeight

    // Calculate how far user has scrolled (0 = top, 1 = one viewport down)
    const scrollProgress = Math.min(scrollY / windowHeight, 1)

    // Rocket fades out and blurs as user scrolls
    const opacity = Math.max(0.1, 1 - scrollProgress * 0.8)
    const blur = scrollProgress * 2 // 0 to 10px blur

    svgElement.style.opacity = String(opacity)
    svgElement.style.filter = `blur(${blur}px)`
  }, [])

  useEffect(() => {
    // Initial position
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [handleScroll])

  return null
}
