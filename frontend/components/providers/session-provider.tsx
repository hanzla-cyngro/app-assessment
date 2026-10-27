'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { isLiveMode, isPreviewMode } from '@/lib/config'
import { getSupabase } from '@/lib/supabase/client'
import type { Operator } from '@/lib/types'

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthResult {
  error?: string
  needsConfirmation?: boolean
}

interface SessionContextValue {
  status: SessionStatus
  operator: Operator | null
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  expireSession: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)
const PREVIEW_KEY = 'icc-preview-operator'

function operatorFromUser(user: User): Operator {
  const meta = user.user_metadata as { display_name?: string; avatar_url?: string } | undefined
  const email = user.email ?? ''
  return {
    id: user.id,
    email,
    displayName: meta?.display_name || email.split('@')[0] || 'Operator',
    avatarUrl: meta?.avatar_url ?? null,
  }
}

function friendlyAuthError(message: string, status?: number): string {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed')) return 'Please confirm your email address before signing in.'
  if (m.includes('password') && (m.includes('weak') || m.includes('at least')))
    return 'Password is too weak. Use at least 8 characters.'
  if (status === 429 || m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Invalid email or password.'
  return 'Something went wrong. Please try again.'
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [operator, setOperator] = useState<Operator | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      if (isPreviewMode) {
        const raw = sessionStorage.getItem(PREVIEW_KEY)
        const stored = raw ? (JSON.parse(raw) as Operator) : null
        setOperator(stored)
        setStatus(stored ? 'authenticated' : 'unauthenticated')
      } else {
        setOperator(null)
        setStatus('unauthenticated')
      }
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      setOperator(user ? operatorFromUser(user) : null)
      setStatus(user ? 'authenticated' : 'unauthenticated')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setOperator(session?.user ? operatorFromUser(session.user) : null)
      setStatus(session?.user ? 'authenticated' : 'unauthenticated')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const getToken = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return isPreviewMode && operator ? 'preview' : null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [operator])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase && !isPreviewMode) return { error: 'Configure Supabase URL and publishable key before signing in.' }
    if (!supabase) {
      const op: Operator = {
        id: `preview-${btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
        email,
        displayName: email.split('@')[0],
      }
      sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(op))
      setOperator(op)
      setStatus('authenticated')
      return {}
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: friendlyAuthError(error.message, error.status) }
    return {}
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName: string): Promise<AuthResult> => {
      const supabase = getSupabase()
      if (!supabase && !isPreviewMode) return { error: 'Configure Supabase URL and publishable key before creating an account.' }
      if (!supabase) {
        const result = await signIn(email, password)
        const raw = sessionStorage.getItem(PREVIEW_KEY)
        if (raw) {
          const op = { ...(JSON.parse(raw) as Operator), displayName }
          sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(op))
          setOperator(op)
        }
        return result
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/sign-in`,
          data: { display_name: displayName },
        },
      })
      const duplicateEmail =
        data.user?.identities?.length === 0 ||
        error?.code === 'user_already_exists' ||
        error?.code === 'email_exists' ||
        Boolean(error && /already (registered|exists)/i.test(error.message))
      if (duplicateEmail) return { error: 'This email is already registered. Sign in instead.' }
      if (error) return { error: friendlyAuthError(error.message, error.status) }
      return { needsConfirmation: !data.session }
    },
    [signIn],
  )

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
    else sessionStorage.removeItem(PREVIEW_KEY)
    setOperator(null)
    setStatus('unauthenticated')
  }, [])

  const expireSession = useCallback(() => {
    setOperator(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, operator, getToken, signIn, signUp, signOut, expireSession }),
    [status, operator, getToken, signIn, signUp, signOut, expireSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

export { isLiveMode }
