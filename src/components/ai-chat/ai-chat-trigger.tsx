'use client'

import { useChat } from '@ai-sdk/react'
import { MessageCircle } from 'lucide-react'
import { useCallback, useState } from 'react'

import { AIChatWidget } from '@/components/ai-chat/ai-chat-widget'

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
          className="fixed right-4 bottom-4 z-50 flex cursor-pointer items-center gap-2 rounded-full bg-[#917772] px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_18px_40px_-18px_rgba(97,199,255,0.65)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#61c7ff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:right-6 sm:bottom-6 dark:bg-gray-700 dark:text-white dark:hover:bg-[#74d0ff]/40"
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
