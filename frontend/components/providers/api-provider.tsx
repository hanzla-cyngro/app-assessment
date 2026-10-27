'use client'

import { createContext, useContext, useMemo, useRef } from 'react'
import { isLiveMode, isPreviewMode } from '@/lib/config'
import { createHttpApi } from '@/lib/api/http-api'
import { createPreviewApi } from '@/lib/api/preview-api'
import type { IncidentApi } from '@/lib/api/types'
import { useSession } from './session-provider'

const ApiContext = createContext<IncidentApi | null>(null)

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getToken, operator, expireSession } = useSession()
  const tokenRef = useRef(getToken)
  tokenRef.current = getToken
  const userRef = useRef(operator?.id ?? null)
  userRef.current = operator?.id ?? null

  const api = useMemo(
    () =>
      isLiveMode
        ? createHttpApi(() => tokenRef.current(), expireSession)
        : isPreviewMode
          ? createPreviewApi(() => userRef.current)
          : createHttpApi(() => tokenRef.current(), expireSession),
    [expireSession],
  )

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useApi() {
  const api = useContext(ApiContext)
  if (!api) throw new Error('useApi must be used within ApiProvider')
  return api
}
