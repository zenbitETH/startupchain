import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-border bg-card/50 border-t py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <Link href="/" className="mb-4 flex items-center space-x-2 md:mb-0">
            <Image src="/logo.svg" width={35} height={35} alt="StartUpChain Logo"/>
            <span className="text-foreground text-xl font-normal tracking-widest">
              StartUpChain
            </span>
          </Link>
          <div className="text-muted-foreground flex items-center space-x-6 text-sm">
           {/*<a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Twitter
            </a>*/}
            <a href="#" className="hover:text-foreground transition-colors">
              Discord
            </a>
       
          </div>
        </div>
      </div>
    </footer>
  )
}