// Embedded knowledge base for AI chat
// This file can be expanded to include more knowledge articles or FAQs as needed

export type KnowledgeEntry = {
  question: string
  answer: string
  keywords: string[]
}

export type KnowledgeMatch = KnowledgeEntry & {
  score: number
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    question: 'What is StartupChain?',
    answer:
      'StartupChain is a platform that allows you to register ENS names, split revenue transparently, and build with the security of blockchain technology without needing a wallet to start.',
    keywords: ['startupchain', 'what is', 'platform'],
  },
  {
    question: 'How do I register an ENS name?',
    answer:
      'To register an ENS name, simply visit our registration page, choose your desired name, and follow the prompts to complete the registration process.',
    keywords: ['register', 'ens name', 'how to'],
  },
  {
    question: 'Is a wallet required to use StartupChain?',
    answer:
      'No wallet is required to start using StartupChain. You can begin building your business on-chain without one.',
    keywords: ['wallet', 'required', 'use'],
  },
  {
    question: 'How does revenue splitting work?',
    answer:
      'Revenue splitting on StartupChain is done transparently using smart contracts, ensuring that all parties receive their fair share automatically.',
    keywords: ['revenue', 'splitting', 'how does'],
  },
  {
    question: 'What blockchain technology does StartupChain use?',
    answer:
      'StartupChain leverages Ethereum and ENS (Ethereum Name Service) to provide secure and decentralized services for its users.',
    keywords: ['blockchain', 'technology', 'ethereum', 'ens'],
  },
]

const DEFAULT_MIN_SCORE = 1

function scoreEntry(
  normalizedMessage: string,
  messageTokens: string[],
  entry: KnowledgeEntry
): number {
  let score = 0

  for (const keyword of entry.keywords) {
    const normalizedKeyword = keyword.toLowerCase()

    if (normalizedKeyword.includes(' ')) {
      if (normalizedMessage.includes(normalizedKeyword)) {
        score += 1
      }
    } else if (messageTokens.includes(normalizedKeyword)) {
      score += 1
    }
  }

  if (normalizedMessage.includes(entry.question.toLowerCase())) {
    score += 1
  }

  return score
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

export function getRelevantKnowledge(
  userMessage: string,
  options?: { maxResults?: number; minScore?: number }
): KnowledgeMatch[] {
  const maxResults = options?.maxResults ?? 2
  const minScore = options?.minScore ?? DEFAULT_MIN_SCORE

  const normalizedMessage = userMessage.toLowerCase()
  const tokens = tokenize(userMessage)

  return KNOWLEDGE_BASE.map((entry) => ({
    ...entry,
    score: scoreEntry(normalizedMessage, tokens, entry),
  }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

export function buildKnowledgeContext(matches: KnowledgeMatch[]): string {
  if (matches.length === 0) return ''

  const sections = matches.map((match, index) => {
    return `${index + 1}. ${match.question}\nAnswer: ${match.answer}`
  })

  return ['Reference knowledge about StartupChain:', ...sections].join('\n\n')
}

// Simple matching function to find a single answer
export function findAnswer(userMessage: string): string {
  const [topMatch] = getRelevantKnowledge(userMessage, { maxResults: 1 })
  if (topMatch) return topMatch.answer
  return "I'm not sure yet, but the team is expanding the knowledge base."
}
