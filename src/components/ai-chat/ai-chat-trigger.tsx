'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { AIChatWidget } from '@/components/ai-chat/ai-chat-widget'
import { cn, generateUUID } from '@/lib/utils'

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{
    type: 'text'
    text: string
    state?: 'streaming' | 'done'
  }>
}

export function AIChatTrigger() {
  const [isOpen, setIsOpen] = useState(false)
  const chatId = useMemo(() => `floating-chat-${generateUUID()}`, [])
  const [inputValue, setInputValue] = useState('')

  const { messages, sendMessage, status, stop, error, clearError } =
    useChat<Message>({
      id: chatId,
      experimental_throttle: 120,
      transport: new DefaultChatTransport({
        api: '/api/ai-chat',
      }),
    })

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

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (error) {
      clearError()
    }
  }, [clearError, error])

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-[#917772] px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_40px_-18px_rgba(97,199,255,0.65)] transition-all duration-200 hover:bg-[#74d0ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#61c7ff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:right-6 sm:bottom-6 cursor-pointer"
          aria-label="Open chat"
        >
          <MessageCircle className="h-4 w-4" />
          Ask a question
        </button>
      )}

      <AIChatWidget
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSendMessage}
        status={status}
        stop={stop}
        error={error}
      />
    </>
  )
}
