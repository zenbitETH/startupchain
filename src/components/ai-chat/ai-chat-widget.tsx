'use client'

import type { ChatStatus } from 'ai'
import { Send, X } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { UIMessage } from '@ai-sdk/react'

interface AIChatWidgetProps {
  isOpen: boolean
  onClose: () => void
  messages: UIMessage
  inputValue: string
  onInputChange: Dispatch<SetStateAction<string>>
  onSend: () => void
  status: ChatStatus
  stop: () => Promise<void>
  error?: Error
}


export function AIChatWidget({
  isOpen,
  onClose,
  messages,
  inputValue,
  onInputChange,
  onSend,
  status,
  stop,
  error,
}: AIChatWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  const isBusy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (!isOpen) return
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status, isOpen])

  useEffect(() => {
    if (!isOpen) return
    containerRef.current?.focus({ preventScroll: true })
  }, [isOpen])

  const placeholder = useMemo(() => {
    if (isBusy) return 'StartupChain Assistant is responding...'
    return 'Ask StartupChain anything about ENS, revenue splits, or onboarding.'
  }, [isBusy])

  return (
    <div
      className={cn(
        'fixed right-4 bottom-20 w-full max-w-xs transition-all duration-300 ease-out sm:max-w-sm lg:right-8 lg:bottom-10',
        isOpen
          ? 'pointer-events-auto z-50 translate-y-0 opacity-100'
          : 'pointer-events-none -z-10 translate-y-4 opacity-0'
      )}
      aria-hidden={!isOpen}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="pointer-events-auto flex h-[28rem] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 shadow-[0_28px_80px_-40px_rgba(14,20,45,0.9)] ring-1 ring-white/5 focus:outline-none"
      >
        <header className="relative flex items-center justify-between bg-gradient-to-r from-sky-500 to-blue-900 px-5 py-4 text-white shadow-[0_18px_46px_-24px_rgba(82,113,255,0.9)]">
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-wide">
              StartupChain Assistant
            </p>
            <p className="text-xs text-white/80">Here to help anytime</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-br from-slate-950/40 via-slate-950/10 to-slate-900/60 p-5 text-sm text-slate-300 backdrop-blur-2xl">
          {messages.parts.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs leading-relaxed text-slate-200 shadow-[0_12px_30px_-20px_rgba(150,180,255,0.6)]">
              <p className="font-medium text-white">Welcome to StartupChain!</p>
              <p>
                Ask about ENS registrations, revenue splits, or product
                onboarding.
              </p>
            </div>
          )}

          {messages.parts.map((part) => {
            const text = part.type === 'text' ? return part.text
            const isUser = message.role === 'user'
            if (!text) return null

            return (
              <div
                key={message.id}
                className={cn(
                  'flex w-full',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[82%] rounded-3xl px-4 py-2.5 shadow-lg transition-transform duration-200',
                    isUser
                      ? 'bg-gradient-to-br from-sky-500 via-indigo-500 to-blue-600 text-white'
                      : 'border border-white/10 bg-slate-900/80 text-slate-100 backdrop-blur'
                  )}
                >
                  <p className="leading-relaxed tracking-wide whitespace-pre-line">
                    {text}
                  </p>
                </div>
              </div>
            )
          })}

          {isBusy ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 shadow-lg">
                Thinking…
              </div>
            </div>
          ) : null}

          <div ref={scrollAnchorRef} />
        </div>

        <div className="border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-start gap-2.5">
            <textarea
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSend()
                }
              }}
              placeholder={placeholder}
              className="h-20 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-inner transition outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40"
            />
            <button
              onClick={onSend}
              disabled={!inputValue.trim() || isBusy}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-blue-600 text-white shadow-[0_12px_40px_-18px_rgba(56,189,248,0.8)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-40'
              )}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          {isBusy ? (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Generating a reply…</span>
              <button
                type="button"
                onClick={() => {
                  void stop()
                }}
                className="font-medium text-sky-300 transition hover:text-sky-200 focus:outline-none"
              >
                Stop
              </button>
            </div>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs text-red-500">
              {error.message ?? 'Something went wrong. Please try again.'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
