import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, streamText } from 'ai'
import type { UIMessage } from 'ai'

const SYSTEM_PROMPT = `You are StartupChain's helpful assistant. Keep answers short, clear, and friendly.
Never mention your underlying model, provider, or anything related to Mode.
Always refer to yourself simply as StartupChain's helpful assistant.`

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  return createOpenRouter({
    apiKey: apiKey,
  })
}

export async function POST(request: Request) {
  let messages: UIMessage[] | undefined

  try {
    const body = (await request.json()) as { messages?: UIMessage[] }
    messages = body.messages
  } catch (error) {
    console.error('ai-chat:invalid-json', error)
    return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages are required.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  try {
    const openrouter = getOpenRouterClient()

    const result = streamText({
      model: openrouter('x-ai/grok-4-fast:free'),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('ai-chat:error', error)
    return new Response(
      JSON.stringify({ error: 'Assistant is unavailable.' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    )
  }
}
