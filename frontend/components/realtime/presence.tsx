'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'
import type { ConnectionState, PresenceMember } from '@/hooks/use-realtime-room'

export function PresenceStack({
  members,
  currentUserId,
  max = 4,
}: {
  members: PresenceMember[]
  currentUserId?: string
  max?: number
}) {
  const visible = members.slice(0, max)
  const overflow = members.length - visible.length
  return (
    <div className="flex items-center" aria-label={`${members.length} operators online`}>
      <div className="flex -space-x-2">
        {visible.map((m) => (
          <Tooltip key={m.userId}>
            <TooltipTrigger
              render={
                <Avatar className="size-7 ring-2 ring-background">
                  {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-secondary text-[10px] font-medium">
                    {initials(m.displayName)}
                  </AvatarFallback>
                </Avatar>
              }
            />
            <TooltipContent>
              {m.displayName}
              {m.userId === currentUserId ? ' (you)' : ''}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {overflow > 0 && <span className="ml-2 text-xs text-muted-foreground">+{overflow}</span>}
    </div>
  )
}

const connectionLabel: Record<ConnectionState, string> = {
  connecting: 'Connecting',
  connected: 'Live',
  disconnected: 'Offline',
}

export function ConnectionIndicator({ state }: { state: ConnectionState }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
      <span className="relative flex size-2">
        {state === 'connected' && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            state === 'connected' && 'bg-success',
            state === 'connecting' && 'bg-warning',
            state === 'disconnected' && 'bg-destructive',
          )}
        />
      </span>
      {connectionLabel[state]}
    </span>
  )
}

export function TypingIndicator({ names }: { names: string[] }) {
  if (!names.length) return <span className="h-5" aria-hidden="true" />
  const text =
    names.length === 1
      ? `${names[0]} is editing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are editing`
        : `${names.length} operators are editing`
  return (
    <span className="inline-flex h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      <span className="flex gap-0.5" aria-hidden="true">
        <span className="size-1 animate-bounce rounded-full bg-info [animation-delay:-0.3s]" />
        <span className="size-1 animate-bounce rounded-full bg-info [animation-delay:-0.15s]" />
        <span className="size-1 animate-bounce rounded-full bg-info" />
      </span>
      {text}
    </span>
  )
}
