import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class TokenVerifierService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  constructor(private readonly config: ConfigService) {}

  async verify(token: string): Promise<AuthenticatedUser> {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const jwksUrl = this.config.get<string>('SUPABASE_JWKS_URL') ?? (supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json` : undefined);
    const legacySecret = this.config.get<string>('SUPABASE_JWT_SECRET');
    try {
      let payload: JWTPayload;
      if (legacySecret) {
        ({ payload } = await jwtVerify(token, new TextEncoder().encode(legacySecret), {
          algorithms: ['HS256'],
          issuer: supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1` : undefined,
          audience: 'authenticated',
        }));
      } else {
        if (!jwksUrl) throw new Error('Missing Supabase JWKS configuration');
        if (!this.jwks) this.jwks = createRemoteJWKSet(new URL(jwksUrl));
        ({ payload } = await jwtVerify(token, this.jwks, {
          issuer: supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1` : undefined,
          audience: 'authenticated',
        }));
      }
      if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Token subject is missing');
      return {
        id: payload.sub,
        ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
        ...(typeof payload.role === 'string' ? { role: payload.role } : {}),
        userMetadata: payload.user_metadata && typeof payload.user_metadata === 'object' ? payload.user_metadata as Record<string, unknown> : {},
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Supabase access token');
    }
  }
}
