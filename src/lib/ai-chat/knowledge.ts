// Embedded knowledge base for AI chat
// This file can be expanded to include more knowledge articles or FAQs as needed

export const KNOWLEDGE_BASE = [
  {
    question: 'What is StartupChain?',
    answer:
      'StartupChain is a platform that allows you to register ENS names, split revenue transparently, and build with the security of blockchain technology without needing a wallet to start.',
    keywords: ['StartupChain', 'what is', 'platform'],
  },
  {
    question: 'How do I register an ENS name?',
    answer:
      'To register an ENS name, simply visit our registration page, choose your desired name, and follow the prompts to complete the registration process.',
    keywords: ['register', 'ENS name', 'how to'],
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
    keywords: ['blockchain', 'technology', 'Ethereum', 'ENS'],
  },
]

// Simple matching function to find relevant knowledge base articles
export function findAnswer(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()
  let bestMatch = { score: 0, answer: '' }

  for (const item of KNOWLEDGE_BASE) {
    const score = item.keywords.reduce((acc, keyword) => {
      return acc + (lowerMessage.includes(keyword.toLowerCase()) ? 1 : 0)
    }, 0)

    if (score > bestMatch.score) {
      bestMatch = { score, answer: item.answer }
    }
  }

  return bestMatch.score > 0
    ? bestMatch.answer
    : `I'm sorry, I don't have an answer for that.`
}
