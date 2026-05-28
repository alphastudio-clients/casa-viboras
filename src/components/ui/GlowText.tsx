'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowTextProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  animate?: boolean
}

export function GlowText({
  children,
  className,
  as: Tag = 'h2',
  animate = false,
}: GlowTextProps) {
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Tag className={cn('text-glow font-title text-pink', className)}>
          {children}
        </Tag>
      </motion.div>
    )
  }

  return (
    <Tag className={cn('text-glow font-title text-pink', className)}>
      {children}
    </Tag>
  )
}

export function SnakeDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 my-4', className)}>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #D4186C88)' }} />
      <span
        className="font-title text-xs tracking-[0.4em] uppercase"
        style={{ color: '#D4186C' }}
      >
        ✦ VÍBORAS ✦
      </span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #D4186C88, transparent)' }} />
    </div>
  )
}

/** Garras / scratch marks decorativas en SVG */
export function ClawMarks({
  className,
  opacity = 0.25,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <svg
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      {/* 3 líneas de garras diagonales */}
      <line x1="-10%" y1="20%" x2="110%" y2="55%"  stroke="#D4186C" strokeWidth="2" />
      <line x1="-10%" y1="27%" x2="110%" y2="62%"  stroke="#D4186C" strokeWidth="1.2" />
      <line x1="-10%" y1="34%" x2="110%" y2="69%"  stroke="#D4186C" strokeWidth="0.7" />
      {/* segundo grupo más tenue */}
      <line x1="40%"  y1="-5%" x2="90%"  y2="105%" stroke="#D4186C" strokeWidth="1.5" />
      <line x1="46%"  y1="-5%" x2="96%"  y2="105%" stroke="#D4186C" strokeWidth="0.8" />
    </svg>
  )
}

/** Recuadro estilo flyer con bordes rosas */
export function FlyerBox({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {label && (
        <span
          className="absolute -top-3 left-4 font-title text-xs tracking-[0.3em] uppercase px-2"
          style={{ color: '#D4186C', background: '#0a0a0a' }}
        >
          {label}
        </span>
      )}
      <div
        className="w-full"
        style={{
          border: '2px solid #D4186C',
          boxShadow: '0 0 0 1px #D4186C33, 0 0 20px #D4186C33, inset 0 0 20px #D4186C08',
          background: 'rgba(0,0,0,0.5)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
