'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Users, Vote, BarChart2, Calendar, Settings, Home, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',                  label: 'Dashboard',   icon: Home },
  { href: '/admin/temporadas',       label: 'Temporadas',  icon: Calendar },
  { href: '/admin/jugadores',        label: 'Jugadoras',   icon: Users },
  { href: '/admin/votaciones',       label: 'Votaciones',  icon: Vote },
  { href: '/admin/resultados',       label: 'Resultados',  icon: BarChart2 },
  { href: '/admin/configuracion',    label: 'Config',      icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-title tracking-wider uppercase transition-all',
              isActive
                ? 'bg-pink/10 text-pink border-l-2 border-pink'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}

      <div className="border-t border-gray-800 pt-2 mt-2">
        <Link
          href="/"
          onClick={onClick}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-title tracking-wider uppercase text-gray-600 hover:text-gray-400 transition-colors"
        >
          <LogOut size={16} />
          Ver app
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-black border-r border-gray-800/50 z-40 p-4">
        <div className="mb-6 px-3 py-2">
          <p className="font-title text-xs text-gray-700 tracking-[0.3em] uppercase mb-0.5">Admin</p>
          <p className="font-title text-lg text-pink" style={{ textShadow: '0 0 10px #D4186C88' }}>
            🐍 Víboras
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          <NavItems />
        </nav>
      </aside>

      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-black border-b border-gray-800 flex items-center justify-between px-4">
        <p className="font-title text-pink text-lg">🐍 Admin</p>
        <button onClick={() => setOpen((v) => !v)} className="text-white">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/80"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 z-50 bg-black border-r border-gray-800 p-4 pt-16 flex flex-col gap-1"
            >
              <NavItems onClick={() => setOpen(false)} />
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
