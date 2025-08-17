import { CheckCircle, DollarSign, Shield, Sparkles, Users } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <Sparkles className="text-primary h-6 w-6" />,
    title: 'No wallet? No problem',
    description:
      "Start with just an email. We'll create an embedded wallet for you and upgrade to self-custody when you're ready.",
  },
  {
    icon: <DollarSign className="text-primary h-6 w-6" />,
    title: 'Transparent revenue splits',
    description:
      'Set revenue percentages once. Every payment automatically splits between treasury and owners on-chain.',
  },
  {
    icon: <Shield className="text-primary h-6 w-6" />,
    title: 'Multi-sig security',
    description:
      'Enterprise-grade protection with Safe multisig wallets. Multiple signatures required for critical decisions.',
  },
  {
    icon: <Users className="text-primary h-6 w-6" />,
    title: 'Your .eth domain',
    description:
      'Professional ENS names that work as domains, wallets, and identities. Own your name forever.',
  },
  {
    icon: <CheckCircle className="text-primary h-6 w-6" />,
    title: 'Gasless transactions',
    description:
      "No need to buy crypto to get started. We cover gas fees for email users until you're ready to self-custody.",
  },
  {
    icon: <Sparkles className="text-primary h-6 w-6" />,
    title: 'Built for scale',
    description:
      'From MVP to IPO, our infrastructure grows with you. Add team members, adjust splits, upgrade security.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-foreground mb-6 text-3xl font-bold md:text-5xl">
            Everything you need to
            <span className="text-primary"> build unstoppable</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            From idea to IPO, all the infrastructure you need for a transparent,
            decentralized business
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div className="from-primary/20 to-accent/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-background border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  {feature.icon}
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}