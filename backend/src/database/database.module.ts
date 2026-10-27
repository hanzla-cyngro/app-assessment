import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attachment, AttachmentSchema } from '../incidents/schemas/attachment.schema.js';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema.js';
import { IncidentRepository } from '../incidents/repositories/incident.repository.js';
import { AttachmentRepository } from '../storage/repositories/attachment.repository.js';
import { MongooseAttachmentRepository } from './mongoose-attachment.repository.js';
import { MongooseIncidentRepository } from './mongoose-incident.repository.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Incident.name, schema: IncidentSchema },
    { name: Attachment.name, schema: AttachmentSchema },
  ])],
  providers: [
    MongooseIncidentRepository,
    MongooseAttachmentRepository,
    { provide: IncidentRepository, useExisting: MongooseIncidentRepository },
    { provide: AttachmentRepository, useExisting: MongooseAttachmentRepository },
  ],
  exports: [IncidentRepository, AttachmentRepository],
})
export class DatabaseModule {}
