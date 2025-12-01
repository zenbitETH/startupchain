//* Later on, we'll transfer it to a proper vector database and RAG, but for now we'll just inject it into the system prompt.

export const KNOWLEDGE_BASE = [
  // Core Product
  {
    question: 'What is StartupChain?',
    answer:
      'StartupChain is the onchain company OS for founders. It lets you claim an ENS name as your company identity, deploy a Safe multisig treasury automatically, and manage everything from a unified dashboard. No wallet is required to start — you can create one during signup via Privy.',
    keywords: ['startupchain', 'what is', 'platform', 'company', 'onchain'],
  },
  {
    question: 'How does the registration flow work?',
    answer:
      'The registration flow is: 1) Search for an available ENS name, 2) Connect or create a wallet via Privy, 3) Configure your company (founders, equity splits, signature threshold), 4) Send a one-time prepayment covering all costs, 5) StartupChain automatically handles ENS commit, 60-second wait, Safe deployment, ENS registration, and on-chain company recording. You then manage everything from your dashboard.',
    keywords: ['registration', 'flow', 'how to', 'process', 'steps'],
  },

  // ENS
  {
    question: 'How do I register an ENS name?',
    answer:
      'Search for your desired name on the StartupChain landing page. If available, click Register, connect your wallet (or create one), configure your company, and complete the prepayment. StartupChain handles the ENS commit-reveal process automatically, including the required 60-second wait between commit and registration.',
    keywords: ['register', 'ens name', 'how to', 'claim'],
  },
  {
    question: 'Why is there a 60-second wait during ENS registration?',
    answer:
      'ENS uses a commit-reveal scheme to prevent frontrunning. First, a commitment hash is submitted on-chain. After waiting 60 seconds (to ensure the commitment is confirmed), the actual registration can proceed. StartupChain handles this automatically — you just wait while we complete both steps.',
    keywords: ['ens', 'wait', '60 seconds', 'commit', 'reveal', 'frontrun'],
  },
  {
    question: 'Who owns my ENS name?',
    answer:
      'Your ENS name is registered to your company Safe multisig address. This means all founders (Safe owners) collectively control the ENS name, not any single individual. This provides better security and shared governance.',
    keywords: ['ens', 'owner', 'ownership', 'safe', 'who owns'],
  },

  // Safe Treasury
  {
    question: 'What is the Safe treasury?',
    answer:
      'The Safe treasury is a multisig wallet automatically deployed for your company. It holds your company funds, owns your ENS name, and requires multiple founder signatures (based on your threshold) to execute transactions. You can view balances, owners, pending transactions, and history in the /dashboard/safe page.',
    keywords: ['safe', 'treasury', 'multisig', 'wallet', 'what is'],
  },
  {
    question: 'How do I view my Safe balance and transactions?',
    answer:
      'Go to the Safe page in your dashboard (/dashboard/safe). There you can see your ETH and token balances, list of owners, signature threshold, pending transactions awaiting signatures, and recent transaction history. You can also click "Open Safe{Wallet}" to access the full Safe app.',
    keywords: ['safe', 'balance', 'transactions', 'view', 'check'],
  },
  {
    question: 'What is a signature threshold?',
    answer:
      'The signature threshold is the minimum number of founder signatures required to execute a transaction from your Safe. For example, a "2 of 3" threshold means any 2 of the 3 founders must sign. You configure this during company setup.',
    keywords: ['threshold', 'signature', 'multisig', 'owners'],
  },

  // Company Setup
  {
    question: 'Can I have multiple founders?',
    answer:
      'Yes! During setup, you can choose "Multiple Founders" and add wallet addresses for each founder with their equity percentage. Equity must total 100%. All founders become owners of the company Safe, and you set the signature threshold for transactions.',
    keywords: ['founders', 'multiple', 'co-founder', 'equity', 'team'],
  },
  {
    question: 'How does equity splitting work?',
    answer:
      'During company setup, you assign each founder a percentage of equity (must total 100%). This is recorded on-chain and will be used for future company token distribution. The cap table preview on the Tokens page shows the current equity breakdown.',
    keywords: ['equity', 'splitting', 'percentage', 'cap table', 'shares'],
  },

  // Costs & Payment
  {
    question: 'How much does it cost to register a company?',
    answer:
      'The total cost includes: 1) ENS registration fee (varies by name length, typically ~$5-15/year for 5+ character names), 2) Safe deployment gas, 3) A 25% service fee on the ENS cost. You pay once via prepayment, and StartupChain handles all blockchain transactions from there.',
    keywords: ['cost', 'price', 'fee', 'how much', 'payment'],
  },
  {
    question: 'What is the prepayment model?',
    answer:
      'Instead of paying gas for each transaction, you send a single prepayment to the StartupChain treasury that covers all costs (ENS + Safe gas + service fee). Our server wallet then executes all blockchain transactions on your behalf, so you don\'t need to worry about gas or transaction signing.',
    keywords: ['prepayment', 'pay', 'model', 'treasury', 'gas'],
  },

  // Auth & Wallet
  {
    question: 'Is a wallet required to use StartupChain?',
    answer:
      'No wallet is required to start. When you click Register, Privy lets you either connect an existing wallet (like MetaMask) or create a new embedded wallet instantly using email or social login. The embedded wallet works just like a regular wallet.',
    keywords: ['wallet', 'required', 'privy', 'embedded', 'metamask'],
  },
  {
    question: 'What is Privy?',
    answer:
      'Privy is our authentication provider that enables flexible wallet login. You can connect an existing wallet or create a new embedded wallet using email, Google, or other social logins. This means anyone can use StartupChain without prior crypto experience.',
    keywords: ['privy', 'auth', 'login', 'authentication', 'wallet'],
  },

  // Dashboard
  {
    question: 'What can I do on the dashboard?',
    answer:
      'The dashboard gives you a complete view of your on-chain company: company overview (name, ENS, Safe address, founders), treasury summary with live balances and recent transactions, activity feed, and quick links to detailed pages for Safe management (/safe), tokens (/tokens), and ENS details (/ens).',
    keywords: ['dashboard', 'manage', 'view', 'overview', 'features'],
  },

  // Tokens
  {
    question: 'What is the Company Token feature?',
    answer:
      'Company Token (coming soon) lets you deploy an ERC-20 token for your company with built-in vesting schedules, transfer restrictions, and role-based access control. Your Safe becomes the token admin. The cap table preview on /dashboard/tokens shows founder equity that will be used for initial token distribution.',
    keywords: ['token', 'erc20', 'vesting', 'company token', 'deploy'],
  },

  // Chain & Network
  {
    question: 'What blockchain does StartupChain use?',
    answer:
      'StartupChain currently operates on Ethereum Sepolia testnet for testing. The architecture is multi-chain ready and will support Ethereum Mainnet for production. You can see the current network in your dashboard.',
    keywords: ['blockchain', 'chain', 'sepolia', 'ethereum', 'network', 'mainnet'],
  },

  // Support
  {
    question: 'How do I get help or support?',
    answer:
      'For questions or support, you can reach out on X (Twitter) to @gertsio or @HabacucMX. You can also explore the dashboard help sections or ask me anything about the platform!',
    keywords: ['help', 'support', 'contact', 'question', 'assistance'],
  },
]

