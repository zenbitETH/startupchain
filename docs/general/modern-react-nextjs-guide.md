# Modern React (18/19) & Next.js (15/16) Guide

This guide outlines the modern standards for developing in the StartupChain codebase. We leverage the latest features from React 19 and Next.js 16 to build performant, maintainable, and scalable applications.

## 🚀 Core Philosophy

1.  **Server First**: Default to Server Components. Only use Client Components (`"use client"`) when you need interactivity (state, effects, event listeners).
2.  **Async Everything**: Request APIs (params, headers, cookies) are now async.
3.  **Actions over API Routes**: Use Server Actions for mutations and form handling instead of creating manual API endpoints.
4.  **Fetch in Components**: Fetch data directly in Server Components. For client-side fetching, use **React Query**.

---

## ⚛️ React 19 Features

### 1. Actions (Server Actions)
Forget manually handling `onSubmit`, `isLoading`, and `API` calls. React 19 Actions handle pending states, errors, and optimistic updates automatically.

**Old Way (Client-side):**
```tsx
// ❌ Avoid this pattern
"use client";
import { useState } from "react";

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    await fetch('/api/signup', { ... });
    setIsLoading(false);
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Modern Way (Server Actions):**
```tsx
// ✅ Prefer this
// src/app/actions.ts
"use server";

export async function signup(prevState: any, formData: FormData) {
  // Database logic here
  return { message: "Success" };
}

// src/app/signup.tsx
"use client";
import { useActionState } from "react";
import { signup } from "./actions";

export function SignupForm() {
  const [state, action, isPending] = useActionState(signup, null);

  return (
    <form action={action}>
      <input name="email" />
      <button disabled={isPending}>
        {isPending ? "Signing up..." : "Sign Up"}
      </button>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

### 2. The `use` API
Read resources (Promises, Context) in render. This replaces `useContext` and allows conditional reading of Context.

```tsx
import { use } from "react";
import { ThemeContext } from "./theme-context";

function Button() {
  const theme = use(ThemeContext); // Works like useContext
  return <button className={theme}>Click me</button>;
}

function Message({ messagePromise }) {
  const message = use(messagePromise); // Suspends until resolved
  return <p>{message}</p>;
}
```

### 3. `ref` as a Prop
No more `forwardRef`. You can pass `ref` as a standard prop to function components.

```tsx
// ✅ Modern
function MyInput({ placeholder, ref }) {
  return <input placeholder={placeholder} ref={ref} />;
}

// Usage
<MyInput ref={inputRef} />
```

### 4. `<Context>` as a Provider
No more `<Context.Provider>`. Just use `<Context>`.

```tsx
const ThemeContext = createContext('');

function App() {
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  );
}
```

---

## ▲ Next.js 15 & 16 Changes

### 1. Async Request APIs (Breaking Change)
In Next.js 15+, dynamic APIs like `params`, `searchParams`, `headers`, and `cookies` are asynchronous. You **must** await them.

**Page Components:**
```tsx
// ❌ Old
export default function Page({ params, searchParams }) {
  const slug = params.slug;
  const query = searchParams.q;
}

// ✅ Modern
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;

  return <div>Slug: {slug}</div>;
}
```

**Headers & Cookies:**
```tsx
import { cookies, headers } from "next/headers";

export async function UserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  const headerList = await headers();
  const userAgent = headerList.get("user-agent");
}
```

### 2. Caching Defaults (Uncached by Default)
`fetch` requests, `GET` route handlers, and client navigations are no longer cached by default. You must opt-in to caching.

**Server Components:**
```tsx
// Cached (Force Cache)
fetch('https://...', { cache: 'force-cache' });

// Revalidate (ISR)
fetch('https://...', { next: { revalidate: 3600 } });
```

**Client Components (React Query):**
We prefer React Query for client-side data fetching over `useEffect` + `fetch`.

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";

export function UserProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      return res.json();
    }
  });

  if (isLoading) return <p>Loading...</p>;
  return <div>{data.name}</div>;
}
```

### 3. Middleware Location (`src/proxy.ts`)
In Next.js 16, middleware is defined in `src/proxy.ts` instead of `middleware.ts`.

```ts
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return NextResponse.next();
}
```

---

## 🛠️ Best Practices Checklist

- [ ] **Component Type**: Is this component interactive? If no, keep it a Server Component (no `"use client"`).
- [ ] **Data Fetching**: Are you fetching data? Do it directly in the Server Component using `await`. For client-side updates, use React Query. Avoid `useEffect` for data fetching.
- [ ] **Mutations**: Are you submitting a form or changing data? Use Server Actions (`"use server"`).
- [ ] **Params**: Are you accessing `params` or `searchParams`? Remember to `await` them.
- [ ] **State**: Do you need global state? Prefer URL search params for shareable state (filters, pagination) over React Context/Zustand when possible.

## 📚 References
- [React 19 Blog](https://react.dev/blog/2024/04/25/react-19)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
