import { config } from '@/lib/config'
import { getSupabase } from '@/lib/supabase/client'
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  type Attachment,
  type IncidentListQuery,
  type UploadUrlResponse,
} from '@/lib/types'
import { ApiError, normalizeResponseError, toApiError } from './errors'
import type { IncidentApi } from './types'

type TokenProvider = () => Promise<string | null>

export function createHttpApi(getToken: TokenProvider, onUnauthorized: () => void): IncidentApi {
  const base = config.apiBaseUrl.replace(/\/$/, '')

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken()
    if (!token) {
      onUnauthorized()
      throw new ApiError(401, 'Your session has expired. Please sign in again.')
    }
    let res: Response
    try {
      res = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
      })
    } catch (error) {
      throw toApiError(error)
    }
    if (!res.ok) {
      const err = await normalizeResponseError(res)
      if (err.isUnauthorized) onUnauthorized()
      throw err
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  function toQuery(query: IncidentListQuery) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, String(value))
    }
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  return {
    listIncidents: (query, signal) => request(`/incidents${toQuery(query)}`, { signal }),
    getIncident: (id, signal) => request(`/incidents/${encodeURIComponent(id)}`, { signal }),
    createIncident: (input) => request('/incidents', { method: 'POST', body: JSON.stringify(input) }),
    updateIncident: (id, input) =>
      request(`/incidents/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
    transitionStatus: (id, status) =>
      request(`/incidents/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getAnalytics: (signal) => request('/incidents/analytics', { signal }),
    listAttachments: (incidentId, signal) =>
      request(`/incidents/${encodeURIComponent(incidentId)}/attachments`, { signal }),

    async uploadAttachment(incidentId, file) {
      if (!ATTACHMENT_MIME_TYPES.includes(file.type as never)) {
        throw new ApiError(415, 'Unsupported file type. Upload PNG, JPEG, WebP, GIF, or PDF.')
      }
      if (file.size >= ATTACHMENT_MAX_BYTES) throw new ApiError(413, 'File exceeds the 10 MB limit.')
      const id = encodeURIComponent(incidentId)
      const meta = { originalFilename: file.name, mimeType: file.type, sizeBytes: file.size }
      const signed = await request<UploadUrlResponse>(`/incidents/${id}/attachments/upload-url`, {
        method: 'POST',
        body: JSON.stringify(meta),
      })
      const supabase = getSupabase()
      if (!supabase || !signed.token) throw new ApiError(503, 'Supabase Storage upload is not configured correctly.')
      const { error: uploadError } = await supabase.storage.from(signed.bucket ?? 'incident-evidence').uploadToSignedUrl(signed.objectPath, signed.token, file, { contentType: file.type, upsert: false })
      if (uploadError) throw new ApiError(502, 'Upload to storage failed. Please retry.')
      return request<Attachment>(`/incidents/${id}/attachments`, {
        method: 'POST',
        body: JSON.stringify({ ...meta, objectPath: signed.objectPath }),
      })
    },

    getAttachmentReadUrl: (incidentId, attachmentId) =>
      request(
        `/incidents/${encodeURIComponent(incidentId)}/attachments/${encodeURIComponent(attachmentId)}/read-url`,
      ),
  }
}
