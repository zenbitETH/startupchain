'use client'

import { usePrivy } from '@privy-io/react-auth'
import Image from 'next/image'
import Link from 'next/link'

export function Navbar() {
  const { login, authenticated, user } = usePrivy()

  return (
    <nav className="border-border/40 bg-background/80 relative z-50 h-16 border-b backdrop-blur-xl">
      <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex h-full items-center justify-between ">
          <Link href="/" className="flex items-center space-x-2 py-5">
              <Image src="/logo.svg" width={40} height={40} alt="StartUpChain Logo"/>
            <span className="text-foreground text-2xl font-normal tracking-widest">
              StartUpChain
            </span>
          </Link>
          
          <div className="hidden items-center space-x-8 md:flex">
            {authenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-sm">
                  {user?.email?.address ||
                    user?.wallet?.address?.slice(0, 6) + '...'}
                </span>
                <Link
                  href="/dashboard"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-2xl px-4 py-2 font-medium transition-all duration-200"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-4 py-2 font-medium transition-all duration-200"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}