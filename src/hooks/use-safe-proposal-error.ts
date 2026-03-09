'use client'

import { useCallback, useState } from 'react'

import { handleSafeProposalError } from '@/lib/blockchain/safe-proposal-client'

export type SafeProposalErrorState = {
  errorMessage: string | null
  safeApiUnavailable: boolean
}

export type SafeProposalErrorActions = {
  /** Callbacks object to pass directly to `handleSafeProposalError`. */
  errorCallbacks: {
    onApiUnavailable: (msg: string) => void
    onError: (msg: string) => void
  }
  /** Handle a caught error from a Safe proposal flow. */
  handleError: (error: unknown, fallbackMessage: string) => void
  /** Set a custom error message (for validation errors outside Safe flows). */
  setError: (msg: string) => void
  /** Clear all error state (call before starting a new proposal). */
  clearError: () => void
  /** Mark the Safe API as available again (call on successful proposal). */
  markApiAvailable: () => void
}

export function useSafeProposalError(): SafeProposalErrorState &
  SafeProposalErrorActions {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)

  const errorCallbacks = {
    onApiUnavailable: (msg: string) => {
      setSafeApiUnavailable(true)
      setErrorMessage(msg)
    },
    onError: (msg: string) => setErrorMessage(msg),
  }

  const handleError = useCallback(
    (error: unknown, fallbackMessage: string) => {
      handleSafeProposalError(error, fallbackMessage, errorCallbacks)
    },
    // errorCallbacks is stable enough (closures over setters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const setError = useCallback((msg: string) => {
    setErrorMessage(msg)
  }, [])

  const clearError = useCallback(() => {
    setErrorMessage(null)
  }, [])

  const markApiAvailable = useCallback(() => {
    setSafeApiUnavailable(false)
  }, [])

  return {
    errorMessage,
    safeApiUnavailable,
    errorCallbacks,
    handleError,
    setError,
    clearError,
    markApiAvailable,
  }
}
