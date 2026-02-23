'use client'

import {
  ArrowRight,
  Globe,
  Mail,
  PieChart,
  Rocket,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'motion/react'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  highlight: string
}

const features: Feature[] = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'No wallet? No problem',
    description:
      "Start with just an email. We'll create an embedded wallet for you and upgrade to self-custody when you're ready.",
    highlight: 'Embedded Wallets',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Your .eth domain',
    description:
      'Professional ENS names that work as domains, wallets, and identities. Own your name forever.',
    highlight: 'Onchain Identity',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Multi-sig security',
    description:
      'Enterprise-grade protection with Safe multisig wallets. Multiple signatures required for critical decisions.',
    highlight: 'Treasury Safe',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Gasless transactions',
    description:
      "No need to buy crypto to get started. We cover gas fees for email users until you're ready to self-custody.",
    highlight: 'Sponsored Gas',
  },
  {
    icon: <PieChart className="h-6 w-6" />,
    title: 'Transparent revenue splits',
    description:
      'Set revenue percentages once. Every payment automatically splits between treasury and owners on-chain.',
    highlight: 'Smart Splits',
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: 'Built for scale',
    description:
      'From MVP to IPO, our infrastructure grows with you. Add team members, adjust splits, upgrade security.',
    highlight: 'Growth Ready',
  },
]

export function FeaturesSection() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 20%', 'end 80%'],
  })

  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section
      id="features"
      ref={containerRef}
      className="bg-background relative overflow-hidden py-24 md:py-32"
    >
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 -translate-x-1/2 translate-y-[-20%] opacity-20 blur-[100px]">
          <div className="bg-primary h-[600px] w-[600px] rounded-full mix-blend-screen" />
        </div>
        <div className="absolute right-0 bottom-0 translate-x-1/2 translate-y-[20%] opacity-20 blur-[100px]">
          <div className="bg-accent h-[600px] w-[600px] rounded-full mix-blend-screen" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.05]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-foreground mb-6 text-4xl leading-tight font-bold tracking-tighter md:text-5xl lg:text-6xl">
              The complete{' '}
              <span className="animate-gradient-x bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                onchain OS
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              A unified platform for your company&apos;s entire lifecycle. From
              day one to IPO.
            </p>
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Vertical Timeline Line (Desktop Center / Mobile Left) */}
          <div className="bg-border/40 absolute top-0 bottom-0 left-8 w-[2px] md:left-1/2 md:-ml-px" />

          <motion.div
            style={{ height }}
            className="from-primary via-accent to-primary absolute top-0 left-8 w-[2px] origin-top bg-gradient-to-b md:left-1/2 md:-ml-px"
          />

          <div className="space-y-12 md:space-y-24">
            {features.map((feature, index) => (
              <FeatureNode key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureNode({ feature, index }: { feature: Feature; index: number }) {
  const isEven = index % 2 === 0

  return (
    <div
      className={cn(
        'relative flex items-center md:justify-between',
        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
      )}
    >
      {/* Node Point */}
      <div className="border-background bg-foreground shadow-primary/20 absolute left-8 z-20 -ml-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-[3px] shadow-lg md:left-1/2 md:-ml-[11px]">
        <div className="bg-background h-2 w-2 rounded-full" />
      </div>

      {/* Content Card */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn('ml-20 md:ml-0 md:w-[45%]', 'group relative')}
      >
        {/* Connector Line (Horizontal) */}
        <div
          className={cn(
            'bg-border/50 absolute top-1/2 hidden h-px w-8 md:block',
            isEven ? '-right-8' : '-left-8'
          )}
        />
        {/* Mobile Connector */}
        <div className="bg-border/50 absolute top-8 -left-12 h-px w-12 md:hidden" />

        <div className="group/card border-border/50 bg-card/30 hover:border-primary/30 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-8">
          {/* Hover Glow */}
          <div className="from-primary/10 to-accent/10 absolute -inset-px -z-10 bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-500 group-hover/card:opacity-100" />

          {/* Icon Box */}
          <div className="from-primary/10 to-accent/10 border-primary/20 text-primary mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover/card:scale-110 group-hover/card:rotate-3">
            {feature.icon}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-primary/80 text-xs font-bold tracking-wider uppercase">
                Step 0{index + 1}
              </span>
              <div className="bg-border/50 h-px flex-1" />
            </div>

            <h3 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
              {feature.title}
            </h3>

            <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
              {feature.description}
            </p>
          </div>

          {/* Interactive Arrow */}
          <div className="text-primary mt-5 flex -translate-x-2 items-center text-sm font-medium opacity-0 transition-all duration-300 group-hover/card:translate-x-0 group-hover/card:opacity-100">
            <span className="mr-2">{feature.highlight}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </motion.div>

      {/* Spacer for the other side (desktop only) */}
      <div className="hidden md:block md:w-[45%]" />
    </div>
  )
}
