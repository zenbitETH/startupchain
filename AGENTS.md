# AGENTS.md

### Do
- look in `docs/general/` for the active plan/context before making changes
- skim `README.md` for product framing when kicking off new work
- StartupChain = onchain company OS (ENS identity, Safe treasury, EAS attestations, DeFi rails, company token); status: early production
- Core flow: connect/create wallet (Privy built in) → search company ENS → register → manage from dashboard
- use shadCN UI with tailwind v4
- assume Next.js 16 + React 19—prefer server components + server actions/form actions, and only opt into `use client` when required
- use and keep styles in src/style.css
- favor built-in React patterns (context, hooks, server components) for shared state
- lean on forms, URL/search params, or server actions when state needs to persist across sessions
- stay versatile—pick the smallest tool that fits (native APIs first, purpose-built libs like React Hook Form only with clear justification)
- use SSG / SSR where possible, CSR when you have to
- default to small components
- default to small diffs

### Don't
- do not hard code colors
- do not use divs if we have a component component already
- do not add new heavy dependencies without approval
- do not fetch in components
- do not introduce external state libraries (zustand, mobx, etc.)
- do not reintroduce `pages/` router patterns or legacy data fetching (`getServerSideProps`, `getStaticProps`) now that we're on Next.js 16 app router

### Commands
# file scoped checks preferred
yarn tsc --noEmit path/to/file.tsx
yarn prettier --write path/to/file.tsx
next lint --dir src/components --file src/utils/bar.tsx --fix
# tests
yarn vitest run path/to/file.test.tsx
# full build when explicitly requested
yarn build

### Safety and permissions

Allowed without prompt:
- read files, list files
- tsc single file, prettier, eslint,
- vitest single test

Ask first:
- package installs,
- git push
- deleting files, chmod
- running full build or end to end suites

### Project structure
- `/src/app/` - Next.js app router with (app)/ protected routes, (public)/ public routes, api/ endpoints
- `/src/components/` - React components organized by feature (auth/, ens/, ui/, etc.)
- `/src/lib/` - Utilities, web3 integrations, state stores, SWR configs
- `/src/hooks/` - Custom React hooks
- `/src/contracts/` - Solidity smart contracts
- `/src/style.css` - Global styles

### PR checklist
- format and type check: green
- unit tests: green. add tests for new code paths
- diff: small with a brief summary

### When stuck
- ask a clarifying question, propose a short plan, or open a draft PR with notes

### Test first mode
- write or update tests first on new features, then code to green
