import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  DESCRIPTION_MAX,
  PAGE_SIZE_MAX,
  SEVERITIES,
  STATUS_TRANSITIONS,
  TITLE_MAX,
  type Attachment,
  type CreateIncidentInput,
  type Incident,
  type IncidentAnalytics,
  type IncidentListQuery,
  type IncidentStatus,
  type Paginated,
  type UpdateIncidentInput,
} from '@/lib/types'
import { ApiError, type FieldErrors } from './errors'
import type { IncidentApi } from './types'

/**
 * In-browser preview sandbox. Mirrors the NestJS contract (validation, status
 * rules, analytics shape) so the UI can be exercised without a backend.
 * Data lives in memory for this tab only and is never used in live mode.
 */

const HOUR = 60 * 60 * 1000
const SAMPLE_CREATOR = 'preview-sample'

function iso(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString()
}

function seed(): Incident[] {
  const rows: Array<Omit<Incident, 'id'>> = [
    {
      title: 'Checkout API p99 latency above 2s',
      description: 'Payments service latency regression after the 14:05 deploy. Error budget burning at 4x.',
      severity: 'Critical',
      status: 'In Progress',
      assignedUserId: null,
      createdByUserId: SAMPLE_CREATOR,
      resolvedAt: null,
      createdAt: iso(3 * HOUR),
      updatedAt: iso(1 * HOUR),
    },
    {
      title: 'Elevated 5xx on edge region iad1',
      description: 'Intermittent 502s from upstream origin in iad1. Traffic partially shifted to cle1.',
      severity: 'Critical',
      status: 'Open',
      assignedUserId: null,
      createdByUserId: SAMPLE_CREATOR,
      resolvedAt: null,
      createdAt: iso(40 * 60 * 1000),
      updatedAt: iso(40 * 60 * 1000),
    },
    {
      title: 'Search index replication lag',
      description: 'Replica lag at 90s on the secondary cluster. Reads served stale results.',
      severity: 'Medium',
      status: 'Open',
      assignedUserId: null,
      createdByUserId: SAMPLE_CREATOR,
      resolvedAt: null,
      createdAt: iso(7 * HOUR),
      updatedAt: iso(6 * HOUR),
    },
    {
      title: 'Webhook delivery retries spiking',
      description: 'Retry queue depth tripled. Suspect a downstream consumer timing out.',
      severity: 'Medium',
      status: 'Resolved',
      assignedUserId: null,
      createdByUserId: SAMPLE_CREATOR,
      resolvedAt: iso(20 * HOUR),
      createdAt: iso(26 * HOUR),
      updatedAt: iso(20 * HOUR),
    },
    {
      title: 'Status page certificate expiring in 7 days',
      description: 'Renewal automation failed silently. Needs manual rotation.',
      severity: 'Low',
      status: 'Open',
      assignedUserId: null,
      createdByUserId: SAMPLE_CREATOR,
      resolvedAt: null,
      createdAt: iso(30 * HOUR),
      updatedAt: iso(30 * HOUR),
    },
    {
      title: 'Build cache hit rate dropped to 40%',
      description: 'Cache key change in CI config invalidated most artifacts.',
      severity: 'Low',
      status: 'Resolved',
      assignedUserId: null,
      createdByUserId: SAMPLE_CREATOR,
      resolvedAt: iso(44 * HOUR),
      createdAt: iso(50 * HOUR),
      updatedAt: iso(44 * HOUR),
    },
  ]
  return rows.map((r, i) => ({ ...r, id: `pv${(i + 1).toString().padStart(4, '0')}` }))
}

interface StoredAttachment extends Attachment {
  objectUrl: string
}

const store = {
  incidents: seed(),
  attachments: [] as StoredAttachment[],
  pendingUploads: new Map<string, { incidentId: string; file: File }>(),
  counter: 100,
}

function delay<T>(value: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(structuredClone(value)), 180)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

function validateFields(input: UpdateIncidentInput, partial: boolean) {
  const errors: FieldErrors = {}
  if (!partial || input.title !== undefined) {
    const title = (input.title ?? '').trim()
    if (!title) errors.title = 'title should not be empty'
    else if (title.length > TITLE_MAX) errors.title = `title must be at most ${TITLE_MAX} characters`
  }
  if (input.description !== undefined && input.description.length > DESCRIPTION_MAX) {
    errors.description = `description must be at most ${DESCRIPTION_MAX} characters`
  }
  if ((!partial || input.severity !== undefined) && !SEVERITIES.includes(input.severity as never)) {
    errors.severity = 'severity must be one of Low, Medium, Critical'
  }
  if (Object.keys(errors).length) throw new ApiError(400, Object.values(errors)[0], errors)
}

function find(id: string) {
  const incident = store.incidents.find((i) => i.id === id)
  if (!incident) throw new ApiError(404, 'Incident not found')
  return incident
}

export function createPreviewApi(currentUserId: () => string | null): IncidentApi {
  function requireUser() {
    const id = currentUserId()
    if (!id) throw new ApiError(401, 'Your session has expired. Please sign in again.')
    return id
  }

  return {
    async listIncidents(query: IncidentListQuery, signal) {
      requireUser()
      const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), PAGE_SIZE_MAX)
      const page = Math.max(query.page ?? 1, 1)
      const q = query.q?.trim().toLowerCase()
      const filtered = store.incidents
        .filter((i) => !query.status || i.status === query.status)
        .filter((i) => !query.severity || i.severity === query.severity)
        .filter((i) => {
          if (!query.assignedUserId) return true
          if (query.assignedUserId === 'unassigned') return i.assignedUserId === null
          return i.assignedUserId === query.assignedUserId
        })
        .filter((i) => !q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const total = filtered.length
      const result: Paginated<Incident> = {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      }
      return delay(result, signal)
    },

    async getIncident(id, signal) {
      requireUser()
      return delay(find(id), signal)
    },

    async createIncident(input: CreateIncidentInput) {
      const userId = requireUser()
      validateFields(input, false)
      const now = new Date().toISOString()
      const incident: Incident = {
        id: `pv${(store.counter++).toString().padStart(4, '0')}`,
        title: input.title.trim(),
        description: input.description.trim(),
        severity: input.severity,
        status: 'Open',
        assignedUserId: input.assignedUserId,
        createdByUserId: userId,
        resolvedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      store.incidents.unshift(incident)
      return delay(incident)
    },

    async updateIncident(id, input) {
      requireUser()
      validateFields(input, true)
      const incident = find(id)
      if (input.title !== undefined) incident.title = input.title.trim()
      if (input.description !== undefined) incident.description = input.description.trim()
      if (input.severity !== undefined) incident.severity = input.severity
      if (input.assignedUserId !== undefined) incident.assignedUserId = input.assignedUserId
      incident.updatedAt = new Date().toISOString()
      return delay(incident)
    },

    async transitionStatus(id, status: IncidentStatus) {
      requireUser()
      const incident = find(id)
      if (!STATUS_TRANSITIONS[incident.status].includes(status)) {
        throw new ApiError(409, `Cannot transition from ${incident.status} to ${status}`)
      }
      incident.status = status
      incident.resolvedAt = status === 'Resolved' ? new Date().toISOString() : null
      incident.updatedAt = new Date().toISOString()
      return delay(incident)
    },

    async getAnalytics(signal) {
      requireUser()
      const activeBySeverity = { Low: 0, Medium: 0, Critical: 0 }
      let totalMs = 0
      let resolvedCount = 0
      for (const i of store.incidents) {
        if (i.status !== 'Resolved') activeBySeverity[i.severity]++
        else if (i.resolvedAt) {
          const ms = Date.parse(i.resolvedAt) - Date.parse(i.createdAt)
          if (ms >= 0) {
            totalMs += ms
            resolvedCount++
          }
        }
      }
      const analytics: IncidentAnalytics = {
        activeBySeverity,
        averageResolutionTimeMs: resolvedCount ? Math.round(totalMs / resolvedCount) : null,
        resolvedCount,
      }
      return delay(analytics, signal)
    },

    async listAttachments(incidentId, signal) {
      requireUser()
      find(incidentId)
      const items: Attachment[] = store.attachments
        .filter((a) => a.incidentId === incidentId)
        .map(({ objectUrl: _objectUrl, ...rest }) => rest)
      return delay(items, signal)
    },

    async uploadAttachment(incidentId, file) {
      const userId = requireUser()
      find(incidentId)
      if (!ATTACHMENT_MIME_TYPES.includes(file.type as never)) {
        throw new ApiError(415, 'Unsupported file type. Upload PNG, JPEG, WebP, GIF, or PDF.')
      }
      if (file.size >= ATTACHMENT_MAX_BYTES) throw new ApiError(413, 'File exceeds the 10 MB limit.')
      const attachment: StoredAttachment = {
        id: `att${store.counter++}`,
        incidentId,
        uploaderUserId: userId,
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
        objectUrl: URL.createObjectURL(file),
      }
      store.attachments.unshift(attachment)
      const { objectUrl: _objectUrl, ...rest } = attachment
      return delay(rest)
    },

    async getAttachmentReadUrl(incidentId, attachmentId) {
      requireUser()
      const att = store.attachments.find((a) => a.id === attachmentId && a.incidentId === incidentId)
      if (!att) throw new ApiError(404, 'Attachment not found')
      return delay({ url: att.objectUrl, expiresInSeconds: 60 })
    },
  }
}
