import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Attachment, type AttachmentDocument } from '../incidents/schemas/attachment.schema.js';
import { Incident } from '../incidents/schemas/incident.schema.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']);
@Injectable()
export class StorageService {
  private client?: SupabaseClient;
  private readonly bucket: string;
  constructor(config: ConfigService, @InjectModel(Incident.name) private incidents: Model<Incident>, @InjectModel(Attachment.name) private attachments: Model<Attachment>) {
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'incident-evidence';
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SECRET_KEY');
    if (url && key) this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  private async assertIncident(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Incident not found');
    const incident = await this.incidents.findById(id).lean();
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }
  private storage() { if (!this.client) throw new ServiceUnavailableException('Supabase Storage is not configured'); return this.client.storage.from(this.bucket); }
  async createUploadUrl(incidentId: string, user: AuthenticatedUser, meta: { originalFilename: string; mimeType: string; sizeBytes: number }) {
    await this.assertIncident(incidentId);
    this.validateMeta(meta);
    const safeName = meta.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'evidence';
    const objectPath = `${incidentId}/${user.id}/${new Types.ObjectId().toHexString()}-${safeName}`;
    const { data, error } = await this.storage().createSignedUploadUrl(objectPath, { upsert: false });
    if (error || !data) throw new ServiceUnavailableException('Could not create a signed upload URL');
    return { uploadUrl: data.signedUrl, objectPath, token: data.token, bucket: this.bucket };
  }
  async register(incidentId: string, user: AuthenticatedUser, body: { originalFilename: string; mimeType: string; sizeBytes: number; objectPath: string }) {
    await this.assertIncident(incidentId);
    this.validateMeta(body);
    if (!body.objectPath.startsWith(`${incidentId}/${user.id}/`) || body.objectPath.includes('..')) throw new BadRequestException('Invalid evidence object path');
    const { data: found, error: listError } = await this.storage().list(`${incidentId}/${user.id}`, { search: body.objectPath.split('/').pop(), limit: 10 });
    const uploaded = found?.find((item) => `${incidentId}/${user.id}/${item.name}` === body.objectPath);
    if (listError || !uploaded) throw new BadRequestException('Uploaded evidence object was not found');
    const actualSize = Number((uploaded.metadata as Record<string, unknown> | undefined)?.size ?? 0);
    const actualMime = String((uploaded.metadata as Record<string, unknown> | undefined)?.mimetype ?? (uploaded.metadata as Record<string, unknown> | undefined)?.contentType ?? '');
    if (actualSize > 0 && actualSize !== body.sizeBytes) throw new BadRequestException('Uploaded file size does not match the declared size');
    if (actualMime && actualMime !== body.mimeType) throw new BadRequestException('Uploaded file type does not match the declared type');
    const existing = await this.attachments.findOne({ objectPath: body.objectPath }).lean();
    if (existing) return this.toDto(existing);
    const item = await this.attachments.create({ incidentId: new Types.ObjectId(incidentId), uploaderUserId: user.id, bucket: this.bucket, objectPath: body.objectPath, originalFilename: body.originalFilename, mimeType: body.mimeType, sizeBytes: body.sizeBytes });
    return this.toDto(item);
  }
  async list(incidentId: string) {
    await this.assertIncident(incidentId);
    const rows = await this.attachments.find({ incidentId: new Types.ObjectId(incidentId) }).sort({ createdAt: -1 }).lean();
    return rows.map((row) => this.toDto(row));
  }
  async readUrl(incidentId: string, attachmentId: string) {
    await this.assertIncident(incidentId);
    if (!isValidObjectId(attachmentId)) throw new NotFoundException('Attachment not found');
    const attachment = await this.attachments.findOne({ _id: attachmentId, incidentId: new Types.ObjectId(incidentId) }).lean();
    if (!attachment) throw new NotFoundException('Attachment not found');
    const expiresInSeconds = 60 * 5;
    const { data, error } = await this.storage().createSignedUrl(attachment.objectPath, expiresInSeconds, { download: attachment.originalFilename });
    if (error || !data) throw new ServiceUnavailableException('Could not create a signed read URL');
    return { url: data.signedUrl, expiresInSeconds };
  }
  private validateMeta(meta: { originalFilename: string; mimeType: string; sizeBytes: number }) {
    if (!meta.originalFilename || meta.originalFilename.length > 255) throw new BadRequestException('Filename is required and must be at most 255 characters');
    if (!ALLOWED.has(meta.mimeType)) throw new BadRequestException('Only PNG, JPEG, WebP, GIF, and PDF files are allowed');
    if (!Number.isInteger(meta.sizeBytes) || meta.sizeBytes < 1 || meta.sizeBytes >= MAX_BYTES) throw new BadRequestException('File must be smaller than 10 MB');
  }
  private toDto(row: AttachmentDocument | (Attachment & { _id: Types.ObjectId })) { return { id: String(row._id), incidentId: String(row.incidentId), uploaderUserId: row.uploaderUserId, originalFilename: row.originalFilename, mimeType: row.mimeType, sizeBytes: row.sizeBytes, createdAt: new Date(row.createdAt).toISOString() }; }
}
