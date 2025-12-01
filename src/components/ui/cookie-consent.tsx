'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Add a small delay before showing the banner
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="font-medium leading-none">Cookie Policy</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to provide you with the best experience and to help improve our website and application.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mt-1 h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={accept}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={accept} className="w-full md:w-auto">
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
