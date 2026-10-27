export interface AttachmentRecord {
  id: string;
  incidentId: string;
  uploaderUserId: string;
  bucket: string;
  objectPath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export type NewAttachmentRecord = Omit<AttachmentRecord, 'id' | 'createdAt'>;

export abstract class AttachmentRepository {
  abstract create(record: NewAttachmentRecord): Promise<AttachmentRecord>;
  abstract findByObjectPath(objectPath: string): Promise<AttachmentRecord | null>;
  abstract findByIdAndIncidentId(id: string, incidentId: string): Promise<AttachmentRecord | null>;
  abstract findByIncidentId(incidentId: string): Promise<AttachmentRecord[]>;
}
