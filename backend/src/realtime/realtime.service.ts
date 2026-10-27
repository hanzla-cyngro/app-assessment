import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private client?: SupabaseClient;
  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SECRET_KEY');
    if (url && key) this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  async publishIncidentChange(incidentId: string, type: string): Promise<void> {
    if (!this.client) return;
    try {
      const channel = this.client.channel('workspace:incident-changes', { config: { private: true } });
      await new Promise<void>((resolve) => {
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({ type: 'broadcast', event: 'incident-changed', payload: { incidentId, type, at: new Date().toISOString() } });
            await this.client?.removeChannel(channel);
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.logger.warn(`Realtime notification unavailable: ${status}`);
            await this.client?.removeChannel(channel);
            resolve();
          }
        });
      });
    } catch (error) {
      this.logger.warn(`Realtime notification failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}
