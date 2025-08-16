# StartupChain

ENS Company Registry dApp - A decentralized application that allows users to register ENS names for companies, choose single or multi-owner structures, and set revenue split percentages.

## Features

- **ENS Name Registration** - Register ENS names for your business
- **Multi-owner Support** - Create single owner or Safe multisig structures
- **Revenue Splitting** - Set revenue split percentages between treasury and owners
- **Email Onboarding** - Support email authentication with embedded wallets via Privy
- **Gasless Transactions** - Enable gasless transactions for email users

## Tech Stack

- [Next.js 14](https://nextjs.org/) with App Router
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Privy](https://privy.io/) for Web3 authentication
- [Wagmi](https://wagmi.sh/) + [Viem](https://viem.sh/) for blockchain interactions
- [ENS](https://ens.domains/) for domain registration
- [Safe](https://safe.global/) for multisig wallets

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:zenbitETH/startupchain.git
cd startupchain
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Privy credentials to `.env`:

```bash
# Get your app ID and secret at https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here
PRIVY_APP_SECRET=your_app_secret_here
```

### 4. Configure Privy

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Create a new app following [this guide](https://docs.privy.io/basics/get-started/dashboard/create-new-app)
3. Copy your App ID and App Secret to the `.env` file
4. Configure your login methods (email, social, wallet)
5. Set up embedded wallets if needed

### 5. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # User dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── AnimatedSkyscraper.tsx
│   ├── business-setup-modal.tsx
│   └── hero-section.tsx
└── lib/                   # Utilities and configurations
    └── web3.ts           # Web3 configuration
```

## Smart Contracts (TODO)

The following contracts need to be implemented:

- **CompanyRegistry.sol** - Store company metadata, ENS names, treasury addresses
- **RevenueManager.sol** - Handle revenue splitting and withdrawals
- **ENS Integration** - Direct integration with ENS registrar contracts
- **Safe Integration** - Multi-signature wallet creation and management

## License

This project is licensed under the MIT License.
