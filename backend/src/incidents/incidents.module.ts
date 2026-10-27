import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { Incident, IncidentSchema } from './schemas/incident.schema.js';
import { IncidentsController } from './incidents.controller.js';
import { IncidentsService } from './incidents.service.js';
@Module({ imports: [MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]), RealtimeModule, StorageModule], controllers: [IncidentsController], providers: [IncidentsService] })
export class IncidentsModule {}
