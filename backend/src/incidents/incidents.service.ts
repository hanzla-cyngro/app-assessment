import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentStatus } from '../common/enums/incident-status.enum.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { IncidentRecord, IncidentRepository } from './repositories/incident.repository.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { StorageService } from '../storage/storage.service.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { ListIncidentsDto } from './dto/list-incidents.dto.js';
import { UpdateIncidentDto } from './dto/update-incident.dto.js';

const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.Open]: [IncidentStatus.InProgress, IncidentStatus.Resolved],
  [IncidentStatus.InProgress]: [IncidentStatus.Open, IncidentStatus.Resolved],
  [IncidentStatus.Resolved]: [IncidentStatus.Open],
};
@Injectable()
export class IncidentsService {
  constructor(private readonly incidents: IncidentRepository, private readonly realtime: RealtimeService, private readonly storage: StorageService) {}

  async create(dto: CreateIncidentDto, user: AuthenticatedUser) {
    const created = await this.incidents.create({ title: dto.title.trim(), description: dto.description, severity: dto.severity, assignedUserId: dto.assignedUserId ?? null, createdByUserId: user.id, status: IncidentStatus.Open, resolvedAt: null });
    await this.realtime.publishIncidentChange(created.id, 'incident.created');
    return this.toDto(created);
  }

  async list(query: ListIncidentsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const result = await this.incidents.findPage({
      status: query.status,
      severity: query.severity,
      assignedUserId: query.assignedUserId === 'unassigned' ? null : query.assignedUserId,
      search: query.q,
    }, page, pageSize);
    return { items: result.items.map((row) => this.toDto(row)), page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) };
  }

  async findOne(id: string) { const row = await this.findById(id); return this.toDto(row); }

  async update(id: string, dto: UpdateIncidentDto) {
    const patch = { ...dto };
    if (typeof dto.title === 'string') patch.title = dto.title.trim();
    if (Object.keys(patch).length === 0) throw new BadRequestException('At least one editable field is required');
    const row = await this.incidents.update(id, patch);
    if (!row) throw new NotFoundException('Incident not found');
    await this.realtime.publishIncidentChange(row.id, 'incident.updated');
    return this.toDto(row);
  }

  async transition(id: string, status: IncidentStatus) {
    const row = await this.findById(id);
    if (row.status !== status && !ALLOWED_TRANSITIONS[row.status].includes(status)) throw new BadRequestException(`Cannot transition incident from ${row.status} to ${status}`);
    if (row.status !== status) {
      const updated = await this.incidents.update(id, { status, resolvedAt: status === IncidentStatus.Resolved ? new Date() : null });
      if (!updated) throw new NotFoundException('Incident not found');
      await this.realtime.publishIncidentChange(updated.id, 'incident.status_changed');
      return this.toDto(updated);
    }
    return this.toDto(row);
  }

  async analytics() {
    return this.incidents.analytics();
  }

  createUploadUrl(id: string, user: AuthenticatedUser, body: { originalFilename: string; mimeType: string; sizeBytes: number }) { return this.storage.createUploadUrl(id, user, body); }
  async registerAttachment(id: string, user: AuthenticatedUser, body: { originalFilename: string; mimeType: string; sizeBytes: number; objectPath: string }) {
    const attachment = await this.storage.register(id, user, body);
    await this.realtime.publishIncidentChange(id, 'attachment.added');
    return attachment;
  }
  listAttachments(id: string) { return this.storage.list(id); }
  readAttachmentUrl(id: string, attachmentId: string) { return this.storage.readUrl(id, attachmentId); }

  private async findById(id: string) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new NotFoundException('Incident not found');
    const row = await this.incidents.findById(id);
    if (!row) throw new NotFoundException('Incident not found');
    return row;
  }
  private toDto(row: IncidentRecord) {
    return { ...row, resolvedAt: row.resolvedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  }
}
