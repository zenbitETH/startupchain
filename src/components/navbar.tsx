'use client'

import { usePrivy } from '@privy-io/react-auth'
import Image from 'next/image'
import Link from 'next/link'

import { LoadingSpinner } from './ui/loading-spinner'

export function Navbar() {
  const { login, authenticated, user, ready } = usePrivy()

  return (
    <nav className="relative z-50 h-16 py-4 backdrop-blur-xl">
      <div className="mx-auto h-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <Link
            href="/"
            className="hover:text-primary flex items-center space-x-2 py-5"
          >
            <Image
              src="/logow.svg"
              width={35}
              height={35}
              alt="StartUpChain Logo"
            />
            <span className="text-foreground hover:text-primary text-3xl font-normal tracking-widest">
              StartUpChain
            </span>
          </Link>

          {/* Mobile version */}
          <div className="flex items-center md:hidden">
            {!ready ? (
              <div className="bg-primary/50 flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium w-16">
                <LoadingSpinner size="sm" className="text-background" />
              </div>
            ) : authenticated ? (
              <Link
                href="/dashboard"
                className="bg-primary text-background hover:bg-primary/90 inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:text-white"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={login}
                className="text-background bg-primary hover:bg-primary/90 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:text-white"
              >
                Login
              </button>
            )}
          </div>

          {/* Desktop version */}
          <div className="hidden items-center space-x-8 md:flex">
            {!ready ? (
              <div className="bg-primary/50 flex items-center justify-center rounded-2xl px-4 py-2 text-2xl font-medium w-24">
                <LoadingSpinner size="lg" className="text-background" />
              </div>
            ) : authenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-xl">
                  {user?.email?.address ||
                    user?.wallet?.address?.slice(0, 6) + '...'}
                </span>
                <Link
                  href="/dashboard"
                  className="bg-primary text-background hover:bg-primary/90 inline-block rounded-2xl px-4 py-2 text-2xl font-medium transition-all duration-200 hover:text-white"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <button
                onClick={login}
                className="text-background bg-primary hover:bg-primary/90 cursor-pointer rounded-2xl px-4 py-2 text-2xl font-medium transition-all duration-200 hover:text-white"
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
