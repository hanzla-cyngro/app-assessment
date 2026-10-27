'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { PresenceMember } from '@/hooks/use-realtime-room'

const WorkspacePresenceContext = createContext<PresenceMember[]>([])

export function WorkspacePresenceProvider({ members, children }: { members: PresenceMember[]; children: ReactNode }) {
  return <WorkspacePresenceContext.Provider value={members}>{children}</WorkspacePresenceContext.Provider>
}

export function useWorkspacePresence() {
  return useContext(WorkspacePresenceContext)
}
