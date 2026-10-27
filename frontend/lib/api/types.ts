import type {
  Attachment,
  CreateIncidentInput,
  Incident,
  IncidentAnalytics,
  IncidentListQuery,
  IncidentStatus,
  Paginated,
  ReadUrlResponse,
  UpdateIncidentInput,
} from '@/lib/types'

export interface IncidentApi {
  listIncidents(query: IncidentListQuery, signal?: AbortSignal): Promise<Paginated<Incident>>
  getIncident(id: string, signal?: AbortSignal): Promise<Incident>
  createIncident(input: CreateIncidentInput): Promise<Incident>
  updateIncident(id: string, input: UpdateIncidentInput): Promise<Incident>
  transitionStatus(id: string, status: IncidentStatus): Promise<Incident>
  getAnalytics(signal?: AbortSignal): Promise<IncidentAnalytics>
  listAttachments(incidentId: string, signal?: AbortSignal): Promise<Attachment[]>
  uploadAttachment(incidentId: string, file: File): Promise<Attachment>
  getAttachmentReadUrl(incidentId: string, attachmentId: string): Promise<ReadUrlResponse>
}
