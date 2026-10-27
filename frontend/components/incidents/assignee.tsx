'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from '@/components/providers/session-provider'
import { initials, shortId } from '@/lib/format'

export function AssigneeLabel({ userId, names }: { userId: string | null; names?: Map<string, string> }) {
  const { operator } = useSession()
  if (!userId) return <span className="text-sm text-muted-foreground">Unassigned</span>
  const name = userId === operator?.id ? 'You' : (names?.get(userId) ?? `Operator ${shortId(userId)}`)
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <Avatar className="size-5">
        <AvatarFallback className="bg-secondary text-[9px]">{initials(name === 'You' ? (operator?.displayName ?? 'Y') : name)}</AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  )
}
