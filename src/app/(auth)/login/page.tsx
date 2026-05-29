'use client'

import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

function LoginCard() {
  const [loading, setLoading] = useState<'google' | 'instagram' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const hasError = searchParams.get('error')

  async function handleOAuthLogin(provider: 'google' | 'instagram') {
    try {
      setLoading(provider)
      setError(null)
      const supabase = createClient()

      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          ...(provider === 'google' && {
            queryParams: { access_type: 'offline', prompt: 'consent' },
          }),
        },
      })

      if (error) throw error
      if (data.url) window.location.href = data.url
    } catch {
      setError('No se pudo iniciar sesión. Intentá de nuevo.')
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
          {/* Instagram Login */}
          <Button
            onClick={() => handleOAuthLogin('instagram')}
            loading={loading === 'instagram'}
            disabled={loading !== null}
            size="lg"
            className="w-full font-title tracking-widest text-white"
            style={{
              background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
              border: 'none',
            }}
          >
            <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Continuar con Instagram
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-700 text-xs">o</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Google Login */}
          <Button
            onClick={() => handleOAuthLogin('google')}
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
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 leading-relaxed">
          Al ingresar aceptás que tus datos se usen para registrar tu voto.
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-pink/5 via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,24,108,0.15) 2px, rgba(212,24,108,0.15) 4px)',
        }}
      />

      {/* Corner decorations */}
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
