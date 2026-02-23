'use client'

import { useChat } from '@ai-sdk/react'
import { MessageCircle } from 'lucide-react'
import { useCallback, useState } from 'react'

import { AIChatWidget } from '@/components/ai-chat/ai-chat-widget'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function AIChatTrigger() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const { messages, sendMessage, status, stop, error, clearError } = useChat({})

  const toggleChat = () => setIsOpen((prev) => !prev)

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || status === 'submitted' || status === 'streaming') {
      return
    }

    try {
      await sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: trimmed }],
      })
      setInputValue('')
    } catch (sendError) {
      console.error('ai-chat:send-error', sendError)
    }
  }, [inputValue, sendMessage, status])

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen)
      if (!nextOpen && error) {
        clearError()
      }
    },
    [clearError, error]
  )

  const handleWidgetClose = useCallback(() => {
    handleClose(false)
  }, [handleClose])

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetTrigger asChild>
        <button
          onClick={toggleChat}
          className={cn(
            'bg-primary text-primary-foreground focus-visible:ring-ring fixed right-4 bottom-4 z-50 flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:right-6 sm:bottom-6',
            !isOpen && 'animate-pulse-slow',
            isOpen && 'pointer-events-none translate-y-4 opacity-0'
          )}
          aria-label="Open chat"
        >
          <MessageCircle className="h-4 w-4" />
          Ask a question
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-[82vh] w-full translate-y-0 flex-col gap-0 border-l-0 p-0 sm:top-auto sm:right-6 sm:bottom-6 sm:max-w-md sm:rounded-xl"
      >
        <SheetTitle className="sr-only">AI Chat Assistant</SheetTitle>
        <AIChatWidget
          isOpen={isOpen}
          onClose={handleWidgetClose}
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSendMessage}
          status={status}
          stop={stop}
          error={error}
        />
      </SheetContent>
    </Sheet>
  )
}
