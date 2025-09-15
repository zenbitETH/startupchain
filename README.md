# StartupChain
🚀 Live Demo: [startupchain.io](https://startupchain.io)

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
- [TanStack Query](https://tanstack.com/query) for data fetching
- [React Hook Form](https://react-hook-form.com/) for form management

## 🏗️ Architecture Principles

This project follows modern Next.js 13+ App Router patterns for optimal performance, SEO, and developer experience.

### Core Architecture

```
Server Components (SSG) + Client Components + Server Actions + TanStack Query
```

### When to Use Each Tool

#### 🎯 Server Components (Default)
**Use for:** Static content, layout, SEO-critical content
```typescript
// ✅ GOOD: Server Components
export default function Page() {
  return (
    <div>
      <h1>Static Headline</h1>        {/* SEO, fast loading */}
      <ProductGrid />                {/* Static content */}
      <Footer />                     {/* Layout */}
    </div>
  )
}
```

#### 🎯 Client Components
**Use for:** User interactions, dynamic content, browser APIs
```typescript
// ✅ GOOD: Client Components
'use client'
function SearchBar() {
  const [query, setQuery] = useState('')
  // User interactions, state management
}
```

#### 🎯 TanStack Query
**Use for:** Data fetching, caching, real-time updates
```typescript
// ✅ GOOD: Reading data
const { data, isLoading } = useQuery({
  queryKey: ['products', category],
  queryFn: () => fetchProducts(category),
  staleTime: 5 * 60 * 1000, // Cache 5 minutes
})
```

#### 🎯 Server Actions
**Use for:** Data mutations, form submissions, security-critical operations
```typescript
// ✅ GOOD: Writing data
'use server'
export async function createProduct(formData: FormData) {
  // Database operations, file uploads, payments
}
```

#### 🎯 API Routes
**Use for:** Complex server logic, third-party integrations, blockchain interactions
```typescript
// ✅ GOOD: Complex operations
export async function POST(request: Request) {
  // Blockchain interactions, external APIs
}
```

### Decision Tree

```
Need to display data?
├── Static/frequent visitors? → Server Components
├── Dynamic/user-specific? → TanStack Query
└── Real-time/updates? → TanStack Query + WebSockets

Need to handle user input?
├── Form submission? → Server Actions
├── Search/filtering? → TanStack Query
└── Real-time input? → Client Components + TanStack Query

Need server-side processing?
├── Simple read? → API Routes
├── Complex mutation? → Server Actions
└── File upload? → Server Actions
```

## 🤝 Contributing

### Code Style & Architecture Guidelines

#### 1. Component Architecture
- **Default to Server Components** for static content
- **Use Client Components only when necessary** (user interactions, browser APIs)
- **Keep components small and focused** on single responsibilities

#### 2. Data Fetching Strategy
- **Use TanStack Query** for client-side data fetching
- **Use Server Actions** for data mutations and form submissions
- **Use API Routes** for complex server logic and blockchain interactions
- **Always implement proper caching** strategies

#### 3. State Management
- **Component state** for UI-only state (modals, forms)
- **TanStack Query** for server state (API data)
- **Context/Redux** only for complex cross-component state

#### 4. Performance Best Practices
- **Preserve SSG** whenever possible
- **Use dynamic imports** for client-only components
- **Implement proper loading states** and error boundaries
- **Optimize bundle size** by code splitting

### Pull Request Guidelines

#### Before Submitting:
1. **Test SSG compatibility** - Ensure new features don't break static generation
2. **Add proper TypeScript types** - No `any` types allowed
3. **Implement error handling** - Graceful error states for all user interactions
4. **Add loading states** - Users should always see feedback
5. **Test on different screen sizes** - Responsive design required

#### Code Review Checklist:
- [ ] **Architecture**: Correct tool used for the job (Server vs Client vs API)
- [ ] **Performance**: SSG preserved, proper caching implemented
- [ ] **TypeScript**: Proper types, no `any` usage
- [ ] **Error Handling**: Comprehensive error states
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Testing**: Unit tests for critical functionality

### Examples

#### ✅ Good: Server Component with Client Enhancement
```typescript
// Server Component (SSG)
export default function ProductPage({ params }) {
  const product = await getProduct(params.id) // Static generation

  return (
    <div>
      <ProductInfo product={product} />     {/* Static content */}
      <AddToCart product={product} />       {/* Client component */}
    </div>
  )
}

// Client Component
'use client'
function AddToCart({ product }) {
  const { data } = useQuery(['cart'], fetchCart)
  // Interactive features
}
```

#### ❌ Bad: Over-using Client Components
```typescript
// BAD: Making everything client
'use client'
export default function ProductPage() {
  const [product, setProduct] = useState(null)
  // Lost SSG benefits, slower loading
}
```

### Development Workflow

1. **Start with Server Components** - Assume everything can be server-rendered
2. **Add Client Components gradually** - Only when interactivity is needed
3. **Use TanStack Query for data** - Automatic caching and state management
4. **Implement Server Actions for mutations** - Secure server-side operations
5. **Test performance impact** - Ensure SSG benefits are preserved

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
│   ├── api/               # API routes for server logic
│   ├── dashboard/         # User dashboard (authenticated)
│   ├── layout.tsx         # Root layout (Server Component)
│   └── page.tsx           # Homepage (Server Component)
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── home/             # Homepage components
│   └── modals/           # Modal components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── ens.ts           # ENS utilities
│   ├── providers.tsx    # React providers
│   └── web3.ts          # Web3 configuration
└── styles/              # Global styles
```

## Smart Contracts (TODO)

The following contracts need to be implemented:

- **CompanyRegistry.sol** - Store company metadata, ENS names, treasury addresses
- **RevenueManager.sol** - Handle revenue splitting and withdrawals
- **ENS Integration** - Direct integration with ENS registrar contracts
- **Safe Integration** - Multi-signature wallet creation and management

## License

This project is licensed under the MIT License.
