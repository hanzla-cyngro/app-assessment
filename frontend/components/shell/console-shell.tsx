'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BarChart3, LayoutGrid, ListChecks, LogOut, Plus, Settings, Siren } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useSession } from '@/components/providers/session-provider'
import { ConnectionIndicator, PresenceStack } from '@/components/realtime/presence'
import { WorkspacePresenceProvider } from '@/components/realtime/workspace-presence'
import { useRealtimeRoom } from '@/hooks/use-realtime-room'
import { useIncidentChanges } from '@/hooks/use-incident-changes'
import { config, isLiveMode } from '@/lib/config'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/incidents', label: 'Incidents', icon: ListChecks },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const { status, operator, signOut } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const workspace = useRealtimeRoom(status === 'authenticated' ? 'workspace:ops' : null)
  useIncidentChanges()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`)
    }
  }, [status, router, pathname])

  if (status !== 'authenticated' || !operator) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <span className="text-sm text-muted-foreground">Restoring session…</span>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <WorkspacePresenceProvider members={workspace.members}>
        <div className="flex min-h-dvh flex-col md:flex-row">
        <aside className="flex shrink-0 flex-col border-b bg-sidebar md:sticky md:top-0 md:h-dvh md:w-60 md:border-r md:border-b-0">
          <div className="flex h-14 items-center gap-2 px-4">
            <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
              <Siren className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Command Center</span>
              <span className="text-xs text-muted-foreground">{config.workspaceName}</span>
            </div>
          </div>
          <nav aria-label="Primary" className="hidden gap-1 px-2 pb-2 md:flex md:flex-col md:pb-0">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto hidden flex-col gap-2 border-t p-4 md:flex">
            <span className="text-xs text-muted-foreground">Operators online</span>
            <div className="flex items-center justify-between">
              <PresenceStack members={workspace.members} currentUserId={operator.id} />
              <ConnectionIndicator state={workspace.connection} />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {!isLiveMode && (
            <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning md:px-8">
              <strong className="font-medium">Preview sandbox.</strong> Sample data lives in this tab only. Set{' '}
              <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code> and Supabase keys to connect the NestJS API.
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <PresenceStack members={workspace.members} currentUserId={operator.id} max={3} />
            </div>
            <Link href="/incidents/new" className={cn(buttonVariants({ size: 'default' }), 'gap-1.5')}>
              <Plus aria-hidden="true" />
              New incident
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Account menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary text-xs">{initials(operator.displayName)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">{operator.displayName}</span>
                    <span className="truncate font-normal">{operator.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings aria-hidden="true" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut()
                    router.replace('/sign-in')
                  }}
                >
                  <LogOut aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:py-8">{children}</main>
        </div>
        </div>
        <nav
          aria-label="Primary mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden"
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] leading-none transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </WorkspacePresenceProvider>
    </TooltipProvider>
  )
}
