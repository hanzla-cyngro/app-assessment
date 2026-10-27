import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { StorageService } from './storage.service.js';
@Module({ imports: [DatabaseModule], providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
