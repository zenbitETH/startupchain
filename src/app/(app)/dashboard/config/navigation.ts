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

export const appNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'ENS Company Names', url: '/dashboard/ens', icon: BadgeCheck },
  { title: 'Multichain Safe', url: '/dashboard/safe', icon: ShieldCheck },
  {
    title: 'EAS Attestations',
    url: '/dashboard/attestations',
    icon: WalletCards,
  },
  { title: 'DeFi Rails', url: '/dashboard/defi', icon: LineChart },
  { title: 'Company Tokens', url: '/dashboard/tokens', icon: Coins },
]

export const footerItems = [
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
  { title: 'Log out', url: '/logout', icon: LogOut },
]
