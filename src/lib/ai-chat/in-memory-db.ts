// In-memory storage for MVP - replaces database functionality
// This will be cleared on server restart, which is perfect for MVP

interface InMemoryChat {
  id: string
  title: string
  userId: string
  visibility: 'public' | 'private'
  createdAt: Date
  lastContext?: any
}

interface InMemoryMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  parts: any[]
  attachments: any[]
  createdAt: Date
}

interface InMemoryVote {
  chatId: string
  messageId: string
  isUpvoted: boolean
}

// Global in-memory storage
let chats = new Map<string, InMemoryChat>()
let messages = new Map<string, InMemoryMessage>()
let votes = new Map<
  string,
  { chatId: string; messageId: string; isUpvoted: boolean }
>()

// Chat operations
export function saveChat(chat: InMemoryChat) {
  chats.set(chat.id, { ...chat, createdAt: new Date() })
}

export function getChatById(id: string): InMemoryChat | undefined {
  return chats.get(id)
}

export function getChatsByUserId(userId: string): InMemoryChat[] {
  return Array.from(chats.values()).filter((chat) => chat.userId === userId)
}

export function updateChatVisibility(
  id: string,
  visibility: 'public' | 'private'
) {
  const chat = chats.get(id)
  if (chat) {
    chats.set(id, { ...chat, visibility })
  }
}

export function deleteChatById(id: string) {
  // Delete chat and all its messages
  chats.delete(id)
  const chatMessages = Array.from(messages.values()).filter(
    (msg) => msg.chatId === id
  )
  chatMessages.forEach((msg) => messages.delete(msg.id))
}

// Message operations
export function saveMessages(msgs: InMemoryMessage[]) {
  msgs.forEach((msg) => {
    messages.set(msg.id, { ...msg, createdAt: new Date() })
  })
}

export function getMessagesByChatId(chatId: string): InMemoryMessage[] {
  return Array.from(messages.values())
    .filter((msg) => msg.chatId === chatId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

export function deleteMessagesByChatIdAfterTimestamp(
  chatId: string,
  timestamp: Date
) {
  const chatMessages = Array.from(messages.values()).filter(
    (msg) => msg.chatId === chatId && msg.createdAt > timestamp
  )
  chatMessages.forEach((msg) => messages.delete(msg.id))
}

// Vote operations
export function getVotesByChatId(chatId: string) {
  return Array.from(votes.values()).filter((vote) => vote.chatId === chatId)
}

export function saveVote(
  chatId: string,
  messageId: string,
  isUpvoted: boolean
) {
  const key = `${chatId}-${messageId}`
  votes.set(key, { chatId, messageId, isUpvoted })
}

// Utility functions
export function getMessageCountByUserId(userId: string): number {
  const userChats = getChatsByUserId(userId)
  let count = 0
  userChats.forEach((chat) => {
    count += getMessagesByChatId(chat.id).length
  })
  return count
}

// Stream operations (simplified)
let streams = new Map<string, string>()

export function createStreamId(streamId: string, chatId: string) {
  streams.set(streamId, chatId)
}

export function getStreamIdsByChatId(chatId: string): string[] {
  return Array.from(streams.entries())
    .filter(([, cId]) => cId === chatId)
    .map(([streamId]) => streamId)
}

// Debug function to see current state
export function getDebugInfo() {
  return {
    chats: Array.from(chats.values()),
    messages: Array.from(messages.values()),
    votes: Array.from(votes.values()),
    streams: Array.from(streams.entries()),
  }
}

// Clear all data (useful for testing)
export function clearAllData() {
  chats.clear()
  messages.clear()
  votes.clear()
  streams.clear()
}
