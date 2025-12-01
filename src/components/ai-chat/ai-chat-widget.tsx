'use client'

import { UIMessage } from '@ai-sdk/react'
import type { ChatStatus } from 'ai'
import { Send } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useRef } from 'react'

import { cn } from '@/lib/utils'

interface AIChatWidgetProps {
  isOpen: boolean
  onClose: () => void
  messages: UIMessage[]
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

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const placeholder = useMemo(() => {
    if (isBusy) return 'StartupChain Assistant is responding...'
    return 'Ask about company setup, Safe treasury, ENS registration, or your dashboard.'
  }, [isBusy])

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="border-border bg-background text-foreground flex h-full flex-col overflow-hidden rounded-xl border shadow-lg focus:outline-none"
    >
      <header className="border-border bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">StartupChain Assistant</p>
          <p className="text-muted-foreground text-xs">
            Your guide to company setup & management
          </p>
        </div>
      </header>

      <div className="bg-muted/40 text-foreground/90 min-h-76 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <div className="border-border bg-card text-muted-foreground rounded-lg border p-3 text-xs leading-relaxed shadow-sm">
            <p className="text-foreground font-medium">
              Welcome to StartupChain!
            </p>
            <p>Ask about company registration, Safe treasury, ENS names, founder setup, or your dashboard.</p>
          </div>
        )}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('')
            .trim()
          if (!text) return null

          const isUser = message.role === 'user'

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
                  'max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm transition-colors',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                <p className="leading-relaxed whitespace-pre-line">{text}</p>
              </div>
            </div>
          )
        })}

        {isBusy ? (
          <div className="flex justify-start">
            <div className="border-border bg-secondary text-secondary-foreground rounded-lg border px-3 py-2 text-xs shadow-sm">
              Thinking…
            </div>
          </div>
        ) : null}

        <div ref={scrollAnchorRef} />
      </div>

      <div className="border-border bg-background/90 border-t p-4">
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
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 h-20 w-full resize-none rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || isBusy}
            className={cn(
              'bg-primary text-primary-foreground focus-visible:ring-primary flex h-11 w-11 items-center justify-center rounded-lg shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2',
              (!inputValue.trim() || isBusy) && 'opacity-50'
            )}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        {isBusy ? (
          <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
            <span>Generating a reply…</span>
            <button
              type="button"
              onClick={() => {
                void stop()
              }}
              className="text-primary hover:text-primary/80 font-medium transition focus:outline-none"
            >
              Stop
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="text-destructive mt-2 text-xs">
            {error.message ?? 'Something went wrong. Please try again.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
