import Link from 'next/link'

import { ChainLogo } from '../ui/chain-logo'

export function NavbarServer() {
  return (
    <nav className="sticky top-0 z-50 h-16 w-full py-4 backdrop-blur-sm">
      <div className="mx-auto h-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <Link
            href="/"
            className="hover:text-primary group flex items-center space-x-2 py-5 text-white"
          >
            <ChainLogo className="text-foreground transition-all duration-200" />
            <span className="text-foreground group-hover:text-primary text-3xl font-normal tracking-widest">
              StartUpChain
            </span>
          </Link>

          {/* Desktop version */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/dashboard"
              className="bg-primary text-background inline-block rounded-2xl px-4 py-1 text-2xl font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-[#46B5D1] hover:to-[#CE6449] hover:text-white"
            >
              Login
            </Link>
          </div>

          {/* Mobile version */}
          <div className="flex items-center md:hidden">
            <Link
              href="/dashboard"
              className="bg-primary text-background inline-block rounded-lg px-3 py-1 text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-[#46B5D1] hover:to-[#CE6449] hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
