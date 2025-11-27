# StartupChain Dashboard Redesign - Implementation Guide

This guide is designed to help you implement the new dashboard design. Since you are using this for interview preparation, it focuses on modern React/Next.js patterns, component composition, and clean UI implementation using Tailwind CSS.

## 🎯 Objective
Build a responsive, sidebar-based dashboard layout with modular widgets for company management.

**Key Tech Stack:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Lucide React (Icons)
- **shadcn/ui** (Component Library)

## 🛠 Component Architecture

We will move from a top-navbar layout to a sidebar layout for the authenticated app area.

### 1. Layout Structure (`src/app/(app)/layout.tsx`)
Currently, it uses `<Navbar />`. We will replace this with a flex container holding a `<Sidebar />` and the main content area.

```tsx
// Conceptual Layout
<div className="flex min-h-screen bg-background">
  <Sidebar />
  <main className="flex-1 flex flex-col">
    <DashboardHeader />
    <div className="p-6">
      {children}
    </div>
  </main>
</div>
```

### 2. New Components to Build

Create these in `src/app/(app)/dashboard/components/` (or a new `layout` folder for shared items like Sidebar).

#### A. `Sidebar`
- **Location**: `src/components/layout/sidebar.tsx` (New file)
- **Props**: None
- **Content**:
  - Logo (top left)
  - Navigation Menu (Dashboard, ENS Names, Safe, Attestations, DeFi, Tokens)
  - Bottom actions (Settings, Log out)
- **Styling**: Fixed width (e.g., `w-64`), dark background, full height.

#### B. `DashboardHeader`
- **Location**: `src/app/(app)/dashboard/components/dashboard-header.tsx`
- **Props**: None (fetches wallet state internally or via props if preferred)
- **Content**:
  - Page Title ("Dashboard")
  - Network Badge (e.g., "Sepolia")
  - Wallet Address (truncated)
  - Avatar/Profile placeholder

#### C. `CompanyOverview` (Widget)
- **Location**: `src/app/(app)/dashboard/components/company-overview.tsx`
- **Props**: `data: MockCompanyData`
- **Content**:
  - Company Name & "Manage Company" button
  - ENS Name display (with green checkmark)
  - Safe Wallet Address display

#### D. `TreasurySummary` (Widget)
- **Location**: `src/app/(app)/dashboard/components/treasury-summary.tsx`
- **Props**: `data: MockTreasuryData`
- **Content**:
  - Total Balance (Big text)
  - "View All" link
  - List of Recent Transactions (Icon, Type, Address, Amount, Time)

#### E. `CompanyToken` (Widget)
- **Location**: `src/app/(app)/dashboard/components/company-token.tsx`
- **Props**: `data: MockTokenData`
- **Content**:
  - Token Name/Symbol
  - Total Supply
  - Contract Address
  - "Manage Token" button (Primary CTA)
  - "Ask a question" button

#### F. `ActivityFeed` (Widget)
- **Location**: `src/app/(app)/dashboard/components/activity-feed.tsx`
- **Props**: `data: MockActivity[]`
- **Content**:
  - List of notifications (Icon, Title, Description, Time)

## 📝 Implementation Steps (Your Todo List)

### Phase 1: Shell & Layout
1. **Create `Sidebar` component**: Implement the navigation links and styles.
2. **Create `DashboardHeader` component**: Build the top bar.
3. **Update Layout**: Refactor `src/app/(app)/layout.tsx` to use the new Sidebar + Header structure.

### Phase 2: Dashboard Widgets (Mock Mode)
4. **Scaffold Dashboard Page**: Update `src/app/(app)/dashboard/page.tsx` with a CSS Grid layout.
5. **Build `CompanyOverview`**: Use mock data for ENS/Safe.
6. **Build `TreasurySummary`**: Mock balance and transaction list.
7. **Build `CompanyToken`**: Mock token stats.
8. **Build `ActivityFeed`**: Mock notification list.

## 💡 Tips for Interview Prep
- **UI Components**: Use **shadcn/ui** components whenever possible. If a specific component is missing, build it on top of **Radix UI** primitives following the shadcn design patterns and styling.
- **Mock Label**: As requested, add a visible 'Mock' badge to any component using mock data. This helps distinguish real vs fake data during development.
- **Types**: Define interfaces for your mock data (e.g., `interface Transaction { id: string; type: 'sent' | 'received'; ... }`).
- **Composition**: Keep components small. If a card has a list, maybe make a `TransactionRow` component.
- **Tailwind**: Use `flex`, `grid`, `gap`, and `space-y` utilities effectively.
- **Mocking**: Create a `const MOCK_DATA = { ... }` at the top of your component file or in a separate `mock-data.ts` file to simulate API responses.

## 🎨 Design Reference
Refer to the provided screenshot for colors, spacing, and hierarchy.
- **Background**: Dark/Black (`bg-[#0F1115]` or similar from your theme)
- **Cards**: Slightly lighter dark (`bg-[#1A1D24]`)
- **Primary Color**: Teal/Cyan for buttons and accents.
