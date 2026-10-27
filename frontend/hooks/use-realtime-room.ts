'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client'
import { isPreviewMode } from '@/lib/config'
import { useSession } from '@/components/providers/session-provider'

export type ConnectionState = 'connecting' | 'connected' | 'disconnected'

export interface PresenceMember {
  userId: string
  displayName: string
  avatarUrl: string | null
}

interface TypingPayload {
  userId: string
  displayName: string
  isTyping: boolean
  at: number
}

type PreviewMessage =
  | { kind: 'heartbeat'; member: PresenceMember; at: number }
  | { kind: 'leave'; userId: string }
  | { kind: 'typing'; payload: TypingPayload }

const TYPING_TTL_MS = 5000
const PRESENCE_TTL_MS = 12000
const HEARTBEAT_MS = 4000
const TYPING_THROTTLE_MS = 1500

/**
 * Presence + typing indicator for a room.
 * Live mode: Supabase Realtime (Presence + Broadcast) on a private channel.
 * Preview mode: BroadcastChannel across tabs of this browser.
 * Channel names: `workspace:ops` and `incident:<id>`.
 */
export function useRealtimeRoom(room: string | null) {
  const { operator } = useSession()
  const [members, setMembers] = useState<PresenceMember[]>([])
  const [typing, setTyping] = useState<TypingPayload[]>([])
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const sendRef = useRef<((payload: TypingPayload) => void) | null>(null)
  const lastSentRef = useRef(0)

  const userId = operator?.id
  const displayName = operator?.displayName
  const avatarUrl = operator?.avatarUrl ?? null

  useEffect(() => {
    if (!room || !userId || !displayName) return
    const me: PresenceMember = { userId, displayName, avatarUrl }
    const receiveTyping = (p: TypingPayload) => {
      if (p.userId === userId) return
      setTyping((prev) => {
        const rest = prev.filter((t) => t.userId !== p.userId)
        return p.isTyping ? [...rest, p] : rest
      })
    }
    const sweep = setInterval(() => {
      const now = Date.now()
      setTyping((prev) => prev.filter((t) => now - t.at < TYPING_TTL_MS))
    }, 1000)

    const supabase = getSupabase()
    if (supabase) {
      let channel: RealtimeChannel | null = supabase.channel(room, {
        config: { private: true, presence: { key: userId } },
      })
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState<PresenceMember>() ?? {}
          const list = Object.values(state)
            .map((entries) => entries[0])
            .filter(Boolean)
          setMembers(list)
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => receiveTyping(payload as TypingPayload))
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setConnection('connected')
            await channel?.track(me)
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnection('disconnected')
          }
        })
      sendRef.current = (payload) => {
        channel?.send({ type: 'broadcast', event: 'typing', payload })
      }
      return () => {
        clearInterval(sweep)
        sendRef.current = null
        if (channel) supabase.removeChannel(channel)
        channel = null
        setMembers([])
        setTyping([])
      }
    }

    if (!isPreviewMode) {
      setConnection('disconnected')
      setMembers([])
      return () => clearInterval(sweep)
    }

    if (typeof BroadcastChannel === 'undefined') {
      setConnection('disconnected')
      setMembers([me])
      return () => clearInterval(sweep)
    }

    const bc = new BroadcastChannel(`icc:${room}`)
    const seen = new Map<string, { member: PresenceMember; at: number }>()
    seen.set(userId, { member: me, at: Date.now() })
    const publishMembers = () => {
      const now = Date.now()
      for (const [id, entry] of seen) if (id !== userId && now - entry.at > PRESENCE_TTL_MS) seen.delete(id)
      setMembers([...seen.values()].map((e) => e.member))
    }
    bc.onmessage = (event: MessageEvent<PreviewMessage>) => {
      const msg = event.data
      if (msg.kind === 'heartbeat') {
        const isNew = !seen.has(msg.member.userId)
        seen.set(msg.member.userId, { member: msg.member, at: msg.at })
        if (isNew) bc.postMessage({ kind: 'heartbeat', member: me, at: Date.now() } satisfies PreviewMessage)
        publishMembers()
      } else if (msg.kind === 'leave') {
        seen.delete(msg.userId)
        publishMembers()
      } else receiveTyping(msg.payload)
    }
    const beat = () => bc.postMessage({ kind: 'heartbeat', member: me, at: Date.now() } satisfies PreviewMessage)
    beat()
    publishMembers()
    setConnection('connected')
    const heartbeat = setInterval(() => {
      beat()
      publishMembers()
    }, HEARTBEAT_MS)
    sendRef.current = (payload) => bc.postMessage({ kind: 'typing', payload } satisfies PreviewMessage)
    return () => {
      clearInterval(sweep)
      clearInterval(heartbeat)
      bc.postMessage({ kind: 'leave', userId } satisfies PreviewMessage)
      bc.close()
      sendRef.current = null
      setMembers([])
      setTyping([])
    }
  }, [room, userId, displayName, avatarUrl])

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!userId || !displayName || !sendRef.current) return
      const now = Date.now()
      if (isTyping && now - lastSentRef.current < TYPING_THROTTLE_MS) return
      lastSentRef.current = isTyping ? now : 0
      sendRef.current({ userId, displayName, isTyping, at: now })
    },
    [userId, displayName],
  )

  return { members, typing, connection, notifyTyping }
}
