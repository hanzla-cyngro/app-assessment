import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IncidentSeverity } from '../common/enums/incident-severity.enum.js';
import { IncidentStatus } from '../common/enums/incident-status.enum.js';
import { Incident } from '../incidents/schemas/incident.schema.js';
import { IncidentAnalytics, IncidentFilters, IncidentPage, IncidentRecord, IncidentRecordPatch, IncidentRepository, NewIncidentRecord } from '../incidents/repositories/incident.repository.js';

type IncidentRow = {
  _id: Types.ObjectId;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  assignedUserId: string | null;
  createdByUserId: string;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MongooseIncidentRepository extends IncidentRepository {
  constructor(@InjectModel(Incident.name) private readonly model: Model<Incident>) { super(); }

  async create(record: NewIncidentRecord): Promise<IncidentRecord> {
    return this.toRecord(await this.model.create(record));
  }

  async findPage(filters: IncidentFilters, page: number, pageSize: number): Promise<IncidentPage> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.assignedUserId !== undefined) where.assignedUserId = filters.assignedUserId;
    if (filters.search?.trim()) where.title = { $regex: filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const [rows, total] = await Promise.all([
      this.model.find(where).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      this.model.countDocuments(where),
    ]);
    return { items: rows.map((row) => this.toRecord(row)), total };
  }

  async findById(id: string): Promise<IncidentRecord | null> {
    const row = await this.model.findById(id).lean();
    return row ? this.toRecord(row) : null;
  }

  async update(id: string, patch: IncidentRecordPatch): Promise<IncidentRecord | null> {
    const row = await this.model.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
    return row ? this.toRecord(row) : null;
  }

  async analytics(): Promise<IncidentAnalytics> {
    const [activeGroups, resolution] = await Promise.all([
      this.model.aggregate<{ _id: IncidentSeverity; count: number }>([
        { $match: { status: { $ne: IncidentStatus.Resolved } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.model.aggregate<{ averageResolutionTimeMs: number | null; resolvedCount: number }>([
        { $match: { status: IncidentStatus.Resolved, resolvedAt: { $type: 'date' }, createdAt: { $type: 'date' } } },
        { $project: { duration: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $match: { duration: { $gte: 0 } } },
        { $group: { _id: null, averageResolutionTimeMs: { $avg: '$duration' }, resolvedCount: { $sum: 1 } } },
      ]),
    ]);
    const activeBySeverity: Record<IncidentSeverity, number> = {
      [IncidentSeverity.Low]: 0,
      [IncidentSeverity.Medium]: 0,
      [IncidentSeverity.Critical]: 0,
    };
    for (const group of activeGroups) activeBySeverity[group._id] = group.count;
    return {
      activeBySeverity,
      averageResolutionTimeMs: resolution[0]?.averageResolutionTimeMs ?? null,
      resolvedCount: resolution[0]?.resolvedCount ?? 0,
    };
  }

  private toRecord(row: IncidentRow): IncidentRecord {
    return {
      id: String(row._id),
      title: row.title,
      severity: row.severity,
      status: row.status,
      description: row.description,
      assignedUserId: row.assignedUserId ?? null,
      createdByUserId: row.createdByUserId,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
