import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { IncidentsController } from './incidents.controller.js';
import { IncidentsService } from './incidents.service.js';
@Module({ imports: [DatabaseModule, RealtimeModule, StorageModule], controllers: [IncidentsController], providers: [IncidentsService] })
export class IncidentsModule {}
