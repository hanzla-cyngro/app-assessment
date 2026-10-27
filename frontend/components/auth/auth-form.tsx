'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Siren } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/components/providers/session-provider'
import { isLiveMode } from '@/lib/config'

type Mode = 'sign-in' | 'sign-up'

function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

export function AuthForm({ mode }: { mode: Mode }) {
  const { status, signIn, signUp } = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace(next)
  }, [status, router, next])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const displayName = String(form.get('displayName') ?? '').trim()
    setError(null)
    if (!email || !password || (mode === 'sign-up' && !displayName)) {
      setError('Please fill in all fields.')
      return
    }
    if (mode === 'sign-up' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setPending(true)
    const result = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password, displayName)
    setPending(false)
    if (result.error) setError(result.error)
    else if (result.needsConfirmation) setConfirmSent(true)
  }

  const isSignIn = mode === 'sign-in'

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
          <Siren className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignIn ? 'Sign in to Command Center' : 'Create operator account'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignIn ? 'Triage and resolve incidents with your team.' : 'Join the incident response workspace.'}
          </p>
        </div>
      </div>

      {confirmSent ? (
        <div role="status" className="rounded-lg border bg-card p-6 text-center text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            We sent a confirmation link. Confirm your email, then sign in.
          </p>
          <Link href="/sign-in" className="mt-4 inline-block text-info hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border bg-card p-6" noValidate>
          {!isSignIn && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" autoComplete="name" placeholder="Ada Lovelace" required />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              required
              minLength={isSignIn ? undefined : 8}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSignIn ? 'Sign in' : 'Create account'}
          </Button>
          {/* {!isLiveMode && (
            <p className="text-center text-xs text-muted-foreground">
              Preview sandbox: any email and password signs you in locally.
            </p>
          )} */}
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <Link href={isSignIn ? '/sign-up' : '/sign-in'} className="text-foreground underline-offset-4 hover:underline">
          {isSignIn ? 'Sign up' : 'Sign in'}
        </Link>
      </p>
    </div>
  )
}
