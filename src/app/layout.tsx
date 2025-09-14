import { Metadata } from 'next'
import { Fredoka } from 'next/font/google'

import { ClientProviders } from '@/lib/providers'
import '@/style.css'

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
      { url: '/favicon.svg', type: 'image/svg+xml' }, // modern browsers
      { url: '/favicon.ico' }, // fallback for old browsers
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fredoka.variable} dark antialiased`}>
      <head></head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
