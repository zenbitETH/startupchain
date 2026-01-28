'use client'

import { UIMessage } from '@ai-sdk/react'
import type { ChatStatus } from 'ai'
import { Bot, Send, Sparkles, StopCircle } from 'lucide-react'
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
    return 'Ask about company setup, Safe treasury, ENS...'
  }, [isBusy])

  const suggestions = [
    'How do I register a company?',
    'Explain Safe treasury',
    'What is an ENS name?',
    'Check my dashboard',
  ]

  const handleSuggestionClick = (suggestion: string) => {
    onInputChange(suggestion)
    // Optional: auto-send or just focus input
    // onSend() would require updating the state first which might be async
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="bg-background/95 border-border text-foreground flex h-full flex-col overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl focus:outline-none"
    >
      {/* Header */}
      <header className="from-primary/10 via-background to-accent/10 border-border flex items-center justify-between border-b bg-gradient-to-r px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-inner">
            <Bot size={20} />
          </div>
          <div className="space-y-0.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              StartupChain AI
              <Sparkles size={12} className="text-accent animate-pulse-slow" />
            </p>
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              Assistant
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="bg-muted/30 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col space-y-6">
          {messages.length === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 py-8 duration-500">
              <div className="bg-card/50 border-border mx-auto max-w-[90%] rounded-2xl border p-6 text-center shadow-sm backdrop-blur-sm">
                <div className="bg-accent/10 text-accent mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-foreground mb-2 font-semibold">
                  Welcome to StartupChain
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  I can help you navigate company formation, manage your
                  treasury, or understand your dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-background/50 hover:bg-background hover:text-primary hover:border-primary/30 text-muted-foreground border-border flex items-center justify-start rounded-lg border px-4 py-3 text-left text-xs transition-all duration-200 hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
                  'animate-in fade-in slide-in-from-bottom-2 flex w-full duration-300',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'flex max-w-[85%] flex-col gap-1',
                    isUser ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase">
                      {isUser ? 'You' : 'AI Assistant'}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'relative rounded-2xl px-5 py-3.5 text-sm shadow-sm',
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-card/80 text-foreground border-border rounded-tl-sm border backdrop-blur-sm'
                    )}
                  >
                    <p className="leading-relaxed whitespace-pre-line">
                      {text}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {isBusy && (
            <div className="animate-in fade-in flex w-full justify-start duration-300">
              <div className="flex max-w-[85%] flex-col items-start gap-1">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-muted-foreground text-[10px] font-medium uppercase">
                    AI Assistant
                  </span>
                </div>
                <div className="bg-card/80 border-border flex items-center gap-1.5 rounded-2xl rounded-tl-sm border px-5 py-4 shadow-sm backdrop-blur-sm">
                  <span className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"></span>
                  <span className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"></span>
                  <span className="bg-primary h-2 w-2 animate-bounce rounded-full"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollAnchorRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-background/80 border-border border-t p-4 backdrop-blur-md">
        <div className="bg-muted/30 ring-border focus-within:bg-background focus-within:ring-primary/30 relative flex items-end gap-2 rounded-xl p-2 ring-1 transition-all focus-within:shadow-lg focus-within:ring-2">
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
            className="text-foreground placeholder:text-muted-foreground min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-sm focus:outline-none"
            rows={1}
            style={{
              minHeight: '44px',
              maxHeight: '120px',
              height:
                Math.min(
                  120,
                  Math.max(44, inputValue.split('\n').length * 20 + 24)
                ) + 'px',
            }}
          />
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || isBusy}
            className={cn(
              'bg-primary text-primary-foreground focus-visible:ring-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md focus:outline-none focus-visible:ring-2',
              (!inputValue.trim() || isBusy) && 'cursor-not-allowed opacity-50'
            )}
            aria-label="Send message"
          >
            <Send size={16} className={cn(isBusy && 'absolute opacity-0')} />
            {isBusy && (
              <span className="absolute h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-muted-foreground text-[10px]">
            {inputValue.length}/1000
          </p>
          {isBusy && (
            <button
              onClick={() => void stop()}
              className="text-destructive hover:text-destructive/80 flex items-center gap-1 text-[10px] font-medium uppercase transition-colors"
            >
              <StopCircle size={10} />
              Stop Generating
            </button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive mt-3 rounded-lg px-3 py-2 text-xs">
            {error.message ?? 'Something went wrong. Please try again.'}
          </div>
        )}
      </div>
    </div>
  )
}
