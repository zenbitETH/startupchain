import { ClientProviders } from '@/lib/providers'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientProviders>{children}</ClientProviders>
}
