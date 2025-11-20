//* Later on, we'll transfer it to a proper vector database and RAG, but for now we'll just inject it into the system prompt.

export const KNOWLEDGE_BASE = [
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

