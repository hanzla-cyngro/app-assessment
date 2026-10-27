import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { IncidentsModule } from './incidents/incidents.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI') }),
    }),
    AuthModule,
    RealtimeModule,
    StorageModule,
    IncidentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
