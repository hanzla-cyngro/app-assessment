export const SEVERITIES = ['Low', 'Medium', 'Critical'] as const
export const STATUSES = ['Open', 'In Progress', 'Resolved'] as const

export type Severity = (typeof SEVERITIES)[number]
export type IncidentStatus = (typeof STATUSES)[number]

export const TITLE_MAX = 140
export const DESCRIPTION_MAX = 5000
export const PAGE_SIZE_MAX = 50

export interface Incident {
  id: string
  title: string
  description: string
  severity: Severity
  status: IncidentStatus
  assignedUserId: string | null
  createdByUserId: string
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface IncidentListQuery {
  page?: number
  pageSize?: number
  status?: IncidentStatus
  severity?: Severity
  assignedUserId?: string | 'unassigned'
  q?: string
}

export interface CreateIncidentInput {
  title: string
  description: string
  severity: Severity
  assignedUserId: string | null
}

export type UpdateIncidentInput = Partial<CreateIncidentInput>

export interface IncidentAnalytics {
  activeBySeverity: Record<Severity, number>
  averageResolutionTimeMs: number | null
  resolvedCount: number
}

export interface Attachment {
  id: string
  incidentId: string
  uploaderUserId: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  objectPath: string
  token?: string
  bucket?: string
}

export interface ReadUrlResponse {
  url: string
  expiresInSeconds: number
}

export interface Operator {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
}

/** Allowed status transitions. Reopening a resolved incident clears resolvedAt. */
export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  Open: ['In Progress', 'Resolved'],
  'In Progress': ['Open', 'Resolved'],
  Resolved: ['Open'],
}

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const ATTACHMENT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const
