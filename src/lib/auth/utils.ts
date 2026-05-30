'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Usar admin client para bypassear RLS en ambas tablas
  const adminClient = await createAdminClient()

  const [{ data: profile }, { data: adminUser }] = await Promise.all([
    adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(),
    adminClient
      .from('admin_users')
      .select('id')
      .eq('email', user.email ?? '')
      .single(),
  ])

  if (profile?.role !== 'admin' && !adminUser) {
    redirect('/')
  }

  return user
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient()
  const callbackUrl = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL!)
  if (redirectTo) callbackUrl.searchParams.set('next', redirectTo)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error) throw error
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
