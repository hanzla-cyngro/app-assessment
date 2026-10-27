'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession, isLiveMode } from '@/components/providers/session-provider'
import { initials } from '@/lib/format'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function SettingsView() {
  const { operator, signOut } = useSession()
  const router = useRouter()

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="profile-title" className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-4 border-b px-5 py-4">
          <Avatar className="size-10">
            <AvatarFallback className="bg-secondary">{initials(operator?.displayName ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <h2 id="profile-title" className="truncate font-medium">
              {operator?.displayName}
            </h2>
            <span className="truncate text-sm text-muted-foreground">{operator?.email}</span>
          </div>
        </div>
        <div className="divide-y">
          <Row label="Operator ID">
            <span className="font-mono text-xs">{operator?.id}</span>
          </Row>
          <Row label="Role">Operator · full workspace access</Row>
        </div>
      </section>

      <section aria-labelledby="env-title" className="overflow-hidden rounded-lg border bg-card">
        <h2 id="env-title" className="border-b px-5 py-4 font-medium">
          Environment
        </h2>
        <div className="divide-y">
          <Row label="Data source">
            {isLiveMode ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                Connected to API
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
                Preview mode (in-browser sample data)
              </span>
            )}
          </Row>
          <Row label="Realtime">{isLiveMode ? 'Supabase Realtime' : 'Cross-tab BroadcastChannel'}</Row>
        </div>
        {!isLiveMode && (
          <p className="border-t px-5 py-4 text-xs text-muted-foreground text-pretty">
            Set NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to connect the
            console to the Fastify API and Supabase.
          </p>
        )}
      </section>

      <div>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut()
            router.replace('/sign-in')
          }}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
