import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { StorageService } from '../storage/storage.service.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { ListIncidentsDto } from './dto/list-incidents.dto.js';
import { UpdateIncidentDto } from './dto/update-incident.dto.js';
import { Incident, IncidentStatus, SEVERITIES, type IncidentDocument } from './schemas/incident.schema.js';

const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  Open: ['In Progress', 'Resolved'],
  'In Progress': ['Open', 'Resolved'],
  Resolved: ['Open'],
};
@Injectable()
export class IncidentsService {
  constructor(@InjectModel(Incident.name) private readonly incidents: Model<Incident>, private readonly realtime: RealtimeService, private readonly storage: StorageService) {}

  async create(dto: CreateIncidentDto, user: AuthenticatedUser) {
    const created = await this.incidents.create({ title: dto.title.trim(), description: dto.description, severity: dto.severity, assignedUserId: dto.assignedUserId ?? null, createdByUserId: user.id, status: 'Open', resolvedAt: null });
    await this.realtime.publishIncidentChange(String(created._id), 'incident.created');
    return this.toDto(created);
  }

  async list(query: ListIncidentsDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.assignedUserId === 'unassigned') filter.assignedUserId = null;
    else if (query.assignedUserId) filter.assignedUserId = query.assignedUserId;
    if (query.q?.trim()) filter.title = { $regex: query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [rows, total] = await Promise.all([
      this.incidents.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      this.incidents.countDocuments(filter),
    ]);
    return { items: rows.map((row) => this.toDto(row)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) { const row = await this.findById(id); return this.toDto(row); }

  async update(id: string, dto: UpdateIncidentDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (typeof dto.title === 'string') patch.title = dto.title.trim();
    if (Object.keys(patch).length === 0) throw new BadRequestException('At least one editable field is required');
    const row = await this.incidents.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
    if (!row) throw new NotFoundException('Incident not found');
    await this.realtime.publishIncidentChange(String(row._id), 'incident.updated');
    return this.toDto(row);
  }

  async transition(id: string, status: IncidentStatus) {
    const row = await this.findById(id);
    if (row.status !== status && !ALLOWED_TRANSITIONS[row.status].includes(status)) throw new BadRequestException(`Cannot transition incident from ${row.status} to ${status}`);
    if (row.status !== status) {
      row.status = status;
      row.resolvedAt = status === 'Resolved' ? new Date() : null;
      await row.save();
      await this.realtime.publishIncidentChange(String(row._id), 'incident.status_changed');
    }
    return this.toDto(row);
  }

  async analytics() {
    const [activeGroups, resolution] = await Promise.all([
      this.incidents.aggregate<{ _id: string; count: number }>([
        { $match: { status: { $ne: 'Resolved' } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.incidents.aggregate<{ averageResolutionTimeMs: number | null; resolvedCount: number }>([
        { $match: { status: 'Resolved', resolvedAt: { $type: 'date' }, createdAt: { $type: 'date' } } },
        { $project: { duration: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $match: { duration: { $gte: 0 } } },
        { $group: { _id: null, averageResolutionTimeMs: { $avg: '$duration' }, resolvedCount: { $sum: 1 } } },
      ]),
    ]);
    const activeBySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<(typeof SEVERITIES)[number], number>;
    for (const group of activeGroups) if (SEVERITIES.includes(group._id as never)) activeBySeverity[group._id as keyof typeof activeBySeverity] = group.count;
    return { activeBySeverity, averageResolutionTimeMs: resolution[0]?.averageResolutionTimeMs ?? null, resolvedCount: resolution[0]?.resolvedCount ?? 0 };
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
    if (!isValidObjectId(id)) throw new NotFoundException('Incident not found');
    const row = await this.incidents.findById(new Types.ObjectId(id));
    if (!row) throw new NotFoundException('Incident not found');
    return row;
  }
  private toDto(row: IncidentDocument | (Incident & { _id: Types.ObjectId })) {
    return { id: String(row._id), title: row.title, severity: row.severity, status: row.status, description: row.description, assignedUserId: row.assignedUserId ?? null, createdByUserId: row.createdByUserId, resolvedAt: row.resolvedAt ? new Date(row.resolvedAt).toISOString() : null, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() };
  }
}
