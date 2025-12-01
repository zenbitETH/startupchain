import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import { cookies, headers } from 'next/headers'

import { AIChatTrigger } from '@/components/ai-chat/ai-chat-trigger'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { ProvidersShell } from '@/components/providers/providers-shell'
import { getServerSession } from '@/lib/auth/server-session'
import '@/style.css'

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
}

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://startupchain.io'),
  title: 'StartupChain - Build your business on-chain',
  description:
    'Register ENS names, split revenue transparently, and build with the security of blockchain technology. No wallet required to start.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
  openGraph: {
    title: 'StartupChain - Build your business on-chain',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StartupChain - Build your business on-chain',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StartupChain - Build your business on-chain',
    description:
      'Register ENS names, split revenue transparently, and build with the security of blockchain technology. No wallet required to start.',
    images: ['/og-image.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()])
  const session = await getServerSession({
    headers: headerList,
    cookies: cookieStore,
  })

  return (
    <html lang="en" className={`${fredoka.variable} dark`}>
      <head />
      <body className="antialiased">
        <ProvidersShell initialSession={session || undefined}>
          {children}
          <AIChatTrigger />
          <CookieConsent />
        </ProvidersShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
