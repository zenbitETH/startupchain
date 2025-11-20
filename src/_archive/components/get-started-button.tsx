'use client'

import { LoginButton } from './login-button'

export function GetStartedButton() {
  return (
    <LoginButton
      redirectTo="/dashboard"
      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-lg font-semibold transition-all duration-200 hover:text-white"
    >
      Get Started
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </LoginButton>
  )
}
