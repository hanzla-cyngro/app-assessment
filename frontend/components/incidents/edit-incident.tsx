'use client'

import { PageHeader } from '@/components/common/page-header'
import { ErrorState } from '@/components/common/states'
import { Skeleton } from '@/components/ui/skeleton'
import { PresenceStack } from '@/components/realtime/presence'
import { IncidentForm } from './incident-form'
import { useIncident } from '@/hooks/use-incidents'
import { useRealtimeRoom } from '@/hooks/use-realtime-room'
import { useWorkspacePresence } from '@/components/realtime/workspace-presence'
import { useSession } from '@/components/providers/session-provider'

export function EditIncident({ id }: { id: string }) {
  const { operator } = useSession()
  const { data, error, isLoading, mutate } = useIncident(id)
  const room = useRealtimeRoom(data ? `incident:${id}` : null)
  const workspaceMembers = useWorkspacePresence()
  const typingNames = room.typing.filter((t) => t.userId !== operator?.id).map((t) => t.displayName)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Edit incident"
        description="Changes are visible to everyone in the workspace."
        actions={data ? <PresenceStack members={room.members} currentUserId={operator?.id} /> : undefined}
      />
      {typingNames.length > 0 && (
        <p role="status" className="mb-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
          {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} also editing. Coordinate before saving.
        </p>
      )}
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <IncidentForm incident={data} members={workspaceMembers} onTyping={room.notifyTyping} />
      )}
    </div>
  )
}
