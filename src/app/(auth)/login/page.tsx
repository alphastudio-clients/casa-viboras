'use client'

import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

function LoginCard() {
  const [loading, setLoading] = useState<'google' | 'anon' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/votar'
  const hasError = searchParams.get('error')

  async function handleGoogleLogin() {
    try {
      setLoading('google')
      setError(null)
      const supabase = createClient()

      // Cerrar sesión anónima antes de Google OAuth para evitar conflictos
      await supabase.auth.signOut()

      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })

      if (error) throw error
      if (data.url) window.location.href = data.url
    } catch {
      setError('No se pudo iniciar sesión. Intentá de nuevo.')
      setLoading(null)
    }
  }

  async function handleAnonVote() {
    try {
      setLoading('anon')
      setError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      window.location.href = redirectTo
    } catch {
      setError('No se pudo continuar. Intentá de nuevo.')
      setLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-sm"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="block mb-4 flex justify-center">
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 8px #D4186C44)',
                'drop-shadow(0 0 20px #D4186C99)',
                'drop-shadow(0 0 8px #D4186C44)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Image
              src="/logo-viboras.png"
              alt="Víboras Rosas"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </motion.div>
        </Link>
        <h1
          className="font-title text-5xl text-pink leading-none mb-2"
          style={{ textShadow: '0 0 20px #D4186C88' }}
        >
          LA CASA
        </h1>
        <p className="text-gray-500 text-sm tracking-widest uppercase">
          Ingresá para votar
        </p>
      </div>

      {/* Card */}
      <div
        className="p-6 rounded-sm"
        style={{
          background: '#111',
          border: '1px solid #D4186C33',
          boxShadow: '0 0 40px #D4186C11',
        }}
      >
        {(error || hasError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 border border-red-800 bg-red-900/20 text-red-400 text-sm text-center"
          >
            {error ?? 'Error de autenticación. Intentá de nuevo.'}
          </motion.div>
        )}

        <div className="flex flex-col gap-3">

          {/* ── Votación pública: sin cuenta ── */}
          <motion.button
            type="button"
            onClick={handleAnonVote}
            disabled={loading !== null}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: loading === 'anon'
                ? ['0 0 20px #D4186C88', '0 0 40px #D4186C', '0 0 20px #D4186C88']
                : ['0 0 12px #D4186C44', '0 0 24px #D4186C66', '0 0 12px #D4186C44'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-full py-4 font-title text-xl tracking-[0.2em] uppercase text-black disabled:opacity-60 flex items-center justify-center gap-3"
            style={{
              background: '#D4186C',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
            }}
          >
            {loading === 'anon' ? (
              <span className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Votar sin cuenta
              </>
            )}
          </motion.button>

          <p className="text-gray-600 text-xs text-center -mt-1 leading-relaxed">
            Para votaciones públicas · Sin registro
          </p>

          {/* Separador */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-700 text-xs uppercase tracking-wider">Si sos jugador/a</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* ── Google (jugadoras / admin) ── */}
          <Button
            onClick={handleGoogleLogin}
            loading={loading === 'google'}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2 inline flex-shrink-0" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </Button>

          <p className="text-gray-700 text-xs text-center -mt-1">
            Para votaciones internas del equipo
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 leading-relaxed">
          Un voto por votación activa.
        </p>
      </div>

      <p className="text-center text-gray-700 text-xs mt-4">
        <Link href="/" className="hover:text-gray-500 transition-colors">
          ← Volver a la casa
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-pink/5 via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,24,108,0.15) 2px, rgba(212,24,108,0.15) 4px)',
        }}
      />
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-pink/40" />
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-pink/40" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-pink/40" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-pink/40" />

      <Suspense
        fallback={
          <div className="w-full max-w-sm text-center text-gray-600 font-title text-lg tracking-widest">
            CARGANDO...
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </div>
  )
}
