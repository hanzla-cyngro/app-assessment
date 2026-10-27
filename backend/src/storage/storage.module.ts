import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attachment, AttachmentSchema } from '../incidents/schemas/attachment.schema.js';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema.js';
import { StorageService } from './storage.service.js';
@Module({ imports: [MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }, { name: Attachment.name, schema: AttachmentSchema }])], providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
