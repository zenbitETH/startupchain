import { google } from '@ai-sdk/google'
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
} from 'ai'
import type { ModelMessage, UIMessage } from 'ai'

import { KNOWLEDGE_BASE } from '@/lib/ai-chat/knowledge'

const SYSTEM_PROMPT = `System Prompt:
  You are StartupChain's helpful assistant. Keep answers short, clear, and friendly.
Never mention your underlying model, provider, or anything related to Mode.
Always refer to yourself simply as StartupChain's helpful assistant.
Knowledge base: ${JSON.stringify(KNOWLEDGE_BASE, null)}`

console.log(SYSTEM_PROMPT)

export const POST = async (req: Request): Promise<Response> => {
  const body = await req.json()

  const messages: UIMessage[] = body.messages

  const modelMessages: ModelMessage[] = convertToModelMessages(messages)

  const streamTextResult = streamText({
    model: google('gemini-2.0-flash-lite'),
    messages: modelMessages,
    system: SYSTEM_PROMPT,
  })

  const stream = streamTextResult.toUIMessageStream()

  return createUIMessageStreamResponse({ stream })
}
