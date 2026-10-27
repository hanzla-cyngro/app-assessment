import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment } from '../incidents/schemas/attachment.schema.js';
import { AttachmentRecord, AttachmentRepository, NewAttachmentRecord } from '../storage/repositories/attachment.repository.js';

type AttachmentRow = {
  _id: Types.ObjectId;
  incidentId: Types.ObjectId;
  uploaderUserId: string;
  bucket: string;
  objectPath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

@Injectable()
export class MongooseAttachmentRepository extends AttachmentRepository {
  constructor(@InjectModel(Attachment.name) private readonly model: Model<Attachment>) { super(); }

  async create(record: NewAttachmentRecord): Promise<AttachmentRecord> {
    return this.toRecord(await this.model.create({ ...record, incidentId: new Types.ObjectId(record.incidentId) }));
  }

  async findByObjectPath(objectPath: string): Promise<AttachmentRecord | null> {
    const row = await this.model.findOne({ objectPath }).lean();
    return row ? this.toRecord(row) : null;
  }

  async findByIdAndIncidentId(id: string, incidentId: string): Promise<AttachmentRecord | null> {
    const row = await this.model.findOne({ _id: id, incidentId: new Types.ObjectId(incidentId) }).lean();
    return row ? this.toRecord(row) : null;
  }

  async findByIncidentId(incidentId: string): Promise<AttachmentRecord[]> {
    const rows = await this.model.find({ incidentId: new Types.ObjectId(incidentId) }).sort({ createdAt: -1 }).lean();
    return rows.map((row) => this.toRecord(row));
  }

  private toRecord(row: AttachmentRow): AttachmentRecord {
    return {
      id: String(row._id),
      incidentId: String(row.incidentId),
      uploaderUserId: row.uploaderUserId,
      bucket: row.bucket,
      objectPath: row.objectPath,
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: new Date(row.createdAt),
    };
  }
}
