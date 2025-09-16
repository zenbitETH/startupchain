import { ClientProviders } from '@/lib/providers'

import { Navbar } from '../../components/navigation/navbar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientProviders>
      <Navbar />
      {children}
    </ClientProviders>
  )
}
