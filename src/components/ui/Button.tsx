'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pink' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  glow?: boolean
}

export function Button({
  children,
  className,
  variant = 'pink',
  size = 'md',
  loading = false,
  glow = false,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'relative inline-flex items-center justify-center font-title uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    pink: 'bg-pink text-black hover:bg-pink-hot hover:shadow-neon-pink',
    outline: 'border-2 border-pink text-pink bg-transparent hover:bg-pink hover:text-black hover:shadow-neon-pink',
    ghost: 'bg-transparent text-white hover:text-pink hover:bg-white/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
    xl: 'text-xl px-10 py-5',
  }

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        glow && 'shadow-neon-pink',
        className
      )}
      disabled={disabled || loading}
      {...(props as object)}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Cargando...
        </span>
      ) : children}
    </motion.button>
  )
}
