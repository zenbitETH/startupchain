'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  Coins,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'

export const appNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'ENS Company Names', url: '/dashboard/ens', icon: BadgeCheck },
  { title: 'Multichain Safe', url: '/dashboard/safe', icon: ShieldCheck },
  { title: 'EAS Attestations', url: '/dashboard/attestations', icon: WalletCards },
  { title: 'DeFi Rails', url: '/dashboard/defi', icon: LineChart },
  { title: 'Company Tokens', url: '/dashboard/tokens', icon: Coins },
]

const footerItems = [
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
  { title: 'Log out', url: '/logout', icon: LogOut },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  if (isMobile) {
    return null
  }

  return (
    <Sidebar className="border-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="StartUpChain logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-2xl"
            priority
          />
          <div>
            <p className="text-sm font-semibold leading-tight">StartUpChain</p>
            <p className="text-xs text-sidebar-foreground/70">Onchain OS</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {appNavItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`)

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
