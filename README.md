# StartupChain

**The onchain company OS for founders.**

StartupChain lets you launch and run your company identity from one place—ENS name, Safe treasury, attestations, and company tokens all managed through a single dashboard. [startupchain.io](https://startupchain.io)

`Status: early production` · `Chain: Sepolia (testnet)`

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🪪 **ENS Identity** | Claim `yourcompany.eth` as your onchain brand |
| 🏦 **Safe Treasury** | Multi-sig wallet deployed automatically for your company |
| 📊 **Dashboard** | View balances, pending transactions, and activity in one place |
| 🪙 **Company Token** | Deploy an ERC-20 with vesting for founders (coming soon) |
| 🧾 **Attestations** | EAS-backed proofs of company activity (coming soon) |

---

## 🚀 How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. Search  │───▶│  2. Setup   │───▶│  3. Pay     │───▶│ 4. Manage   │
│  ENS Name   │    │  Founders   │    │  One-Time   │    │  Dashboard  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │  StartupChain handles automatically: │
                          │  • ENS commit → wait 60s → register │
                          │  • Deploy Safe multisig             │
                          │  • Record company on-chain          │
                          └─────────────────────────────────────┘
```

1. **Connect** – Use your wallet or create one with Privy (built-in)
2. **Search** – Find an available `.eth` name for your company
3. **Configure** – Set up founders and equity splits
4. **Pay** – Send ETH to cover ENS + Safe + service fee
5. **Done** – StartupChain handles all blockchain transactions automatically

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, React 19, TailwindCSS v4, shadcn/ui |
| **Auth** | Privy (embedded wallets + social login) |
| **Blockchain** | Viem, Wagmi, @ensdomains/ensjs |
| **Treasury** | Safe{Wallet} + Safe Transaction Service API |
| **Contracts** | Solidity (StartupChain.sol, CompanyToken.sol) |
| **Chain** | Ethereum Sepolia (testnet) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (public)/        # Landing page, login
│   ├── (app)/dashboard/ # Protected routes
│   │   ├── page.tsx     # Main dashboard
│   │   ├── ens/         # ENS management
│   │   ├── safe/        # Treasury & Safe info
│   │   ├── tokens/      # Company token (coming soon)
│   │   └── setup/       # Registration wizard
│   └── api/             # API routes
├── components/          # UI components
├── hooks/               # React hooks
├── lib/
│   ├── blockchain/      # Contract ABIs, Safe API, chain config
│   └── auth/            # Session management
└── contracts/           # Solidity source
```

---

## 🏃 Quick Start

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Fill in: NEXT_PUBLIC_PRIVY_APP_ID, ALCHEMY_API_KEY, SAFE_API_KEY, etc.

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 Documentation

- **[System Flow](docs/general/system-flow.md)** – Full architecture diagram
- **[Modern React Guide](docs/general/modern-react-nextjs-guide.md)** – React 19 & Next.js 16 patterns
- **[AGENTS.md](AGENTS.md)** – Guidelines for AI coding agents

---

## 💰 Costs

| Component | Who Pays |
|-----------|----------|
| ENS Registration (1 year) | User (via prepayment) |
| Safe Deployment | User (via prepayment) |
| Service Fee (25% of ENS) | User (via prepayment) |
| Gas Fees | Server wallet (from treasury) |

---

## 🤝 Contributing

PRs welcome! Please read [AGENTS.md](AGENTS.md) for coding guidelines.

```bash
# Type check
yarn tsc --noEmit

# Lint
yarn lint

# Test
yarn vitest run

# Build
yarn build
```

---

## 📣 Support

Questions or ideas? Reach out on X: [@gertsio](https://x.com/gertsio) or [@HabacucMX](https://x.com/HabacucMX)

---

**License:** MIT
