import { IncidentSeverity } from '../../common/enums/incident-severity.enum.js';
import { IncidentStatus } from '../../common/enums/incident-status.enum.js';

export interface IncidentRecord {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  assignedUserId: string | null;
  createdByUserId: string;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewIncidentRecord = Omit<IncidentRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type IncidentRecordPatch = Partial<Pick<IncidentRecord, 'title' | 'description' | 'severity' | 'status' | 'assignedUserId' | 'resolvedAt'>>;

export interface IncidentFilters {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignedUserId?: string | null;
  search?: string;
}

export interface IncidentPage {
  items: IncidentRecord[];
  total: number;
}

export interface IncidentAnalytics {
  activeBySeverity: Record<IncidentSeverity, number>;
  averageResolutionTimeMs: number | null;
  resolvedCount: number;
}

export abstract class IncidentRepository {
  abstract create(record: NewIncidentRecord): Promise<IncidentRecord>;
  abstract findPage(filters: IncidentFilters, page: number, pageSize: number): Promise<IncidentPage>;
  abstract findById(id: string): Promise<IncidentRecord | null>;
  abstract update(id: string, patch: IncidentRecordPatch): Promise<IncidentRecord | null>;
  abstract analytics(): Promise<IncidentAnalytics>;
}
