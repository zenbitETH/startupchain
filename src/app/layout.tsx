import { Metadata } from 'next'

import { ClientProviders } from '@/lib/providers'
import '@/style.css'

export const metadata: Metadata = {
  title: 'StartupChain - Build your business on-chain',
  description: 'Register ENS names, split revenue transparently, and build with the security of blockchain technology. No wallet required to start.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fascinate+Inline&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
