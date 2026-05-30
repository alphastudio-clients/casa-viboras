'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const NAV_LINKS = [
  { href: '/casa',      label: 'La Casa' },
  { href: '/jugadores', label: 'Jugadores' },
  { href: '/votar',     label: 'Votar' },
]

interface HeaderProps {
  profile?: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm" style={{ borderBottom: '1px solid #D4186C44', boxShadow: '0 2px 20px #D4186C11' }}>
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-viboras.png"
            alt="Víboras"
            width={36}
            height={36}
            className="drop-shadow-[0_0_8px_#D4186C88] object-contain"
          />
          <span
            className="font-title text-lg tracking-widest hidden sm:block"
            style={{ color: '#D4186C', textShadow: '0 0 8px #D4186C88' }}
          >
            LA CASA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-title text-sm tracking-wider uppercase transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-pink'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'font-title text-sm tracking-wider uppercase transition-colors border px-3 py-1',
                pathname.startsWith('/admin')
                  ? 'border-pink text-pink'
                  : 'border-gray-600 text-gray-400 hover:border-pink hover:text-pink'
              )}
            >
              Admin
            </Link>
          )}
          {profile ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700 text-xs hidden lg:block truncate max-w-[160px]" title={profile.email ?? ''}>
                {profile.email ?? profile.display_name ?? ''}
              </span>
              <form action="/auth/signout" method="post">
                <button className="font-title text-xs tracking-wider text-gray-500 hover:text-white uppercase transition-colors">
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="font-title text-sm tracking-wider uppercase text-gray-400 hover:text-pink transition-colors"
            >
              Entrar
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-t border-pink/20 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-4 gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'font-title text-lg tracking-wider uppercase transition-colors',
                    pathname.startsWith(link.href)
                      ? 'text-pink'
                      : 'text-gray-400'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="font-title text-lg tracking-wider uppercase text-pink"
                >
                  Admin
                </Link>
              )}
              {profile ? (
                <form action="/auth/signout" method="post">
                  <button className="font-title text-sm tracking-wider text-gray-500 uppercase">
                    Cerrar sesión
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="font-title text-lg tracking-wider uppercase text-gray-400"
                >
                  Entrar
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
