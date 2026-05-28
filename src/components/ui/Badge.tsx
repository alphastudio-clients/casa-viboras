import { cn } from '@/lib/utils'
import type { PlayerStatus } from '@/types'

interface BadgeProps {
  status: PlayerStatus
  className?: string
}

const statusConfig: Record<PlayerStatus, { label: string; className: string }> = {
  active:     { label: 'En la casa',  className: 'badge-active' },
  nominated:  { label: 'En placa',    className: 'badge-nominated' },
  leader:     { label: 'Líder',       className: 'badge-leader' },
  eliminated: { label: 'Eliminada',   className: 'badge-eliminated' },
  saved:      { label: 'Salvada',     className: 'badge-saved' },
}

export function StatusBadge({ status, className }: BadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  )
}

export function Badge({
  children,
  className,
  variant = 'default',
}: {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'pink' | 'outline'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-title uppercase tracking-wider',
        variant === 'pink' && 'bg-pink text-black',
        variant === 'outline' && 'border border-pink text-pink',
        variant === 'default' && 'bg-gray-700 text-gray-300',
        className
      )}
    >
      {children}
    </span>
  )
}
