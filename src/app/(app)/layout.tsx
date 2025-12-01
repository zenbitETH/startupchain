import { AppSidebar } from '@/app/(app)/dashboard/components/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
