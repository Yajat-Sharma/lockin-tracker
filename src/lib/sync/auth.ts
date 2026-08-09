import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

export function getAuthRedirectUrl(): string {
  // 1. Check if an explicit app URL is provided in environment variables
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl : `${envUrl}/`
  }

  // 2. Check for Vercel deployment URL if present
  const vercelUrl = (import.meta.env.VITE_VERCEL_URL || import.meta.env.VERCEL_URL) as string | undefined
  if (vercelUrl) {
    const formatted = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
    return formatted.endsWith('/') ? formatted : `${formatted}/`
  }

  // 3. Environment-aware runtime browser origin (e.g. http://localhost:5173/ in Vite dev server)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin
    return origin.endsWith('/') ? origin : `${origin}/`
  }

  // 4. Fallback default for local Vite development
  return 'http://localhost:5173/'
}

export async function signInWithEmail(email: string): Promise<void> {
  if (!supabase) throw new Error('Sync is not configured for this deployment.')
  const redirectTo = getAuthRedirectUrl()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!supabase) return () => {}
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => subscription.unsubscribe()
}
