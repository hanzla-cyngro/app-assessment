import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard.js';
import { TokenVerifierService } from './services/token-verifier.service.js';

@Module({ providers: [TokenVerifierService, { provide: APP_GUARD, useClass: SupabaseAuthGuard }], exports: [TokenVerifierService] })
export class AuthModule {}
