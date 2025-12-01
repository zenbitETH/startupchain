'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

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
import { useWalletAuth } from '@/hooks/use-wallet-auth'

import { appNavItems, footerItems } from '../config/navigation'

export function AppSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const router = useRouter()
  const { disconnect } = useWalletAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
            <p className="text-sm leading-tight font-semibold">StartUpChain</p>
            <p className="text-sidebar-foreground/70 text-xs">Onchain OS</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {appNavItems.map((item) => {
                const isActive =
                  item.url === '/dashboard'
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(`${item.url}/`)

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
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === item.url || pathname.startsWith(`${item.url}/`)
                }
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/40"
              disabled={isLoggingOut}
              onClick={async () => {
                setIsLoggingOut(true)
                try {
                  await disconnect()
                  router.replace('/')
                } finally {
                  setIsLoggingOut(false)
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
