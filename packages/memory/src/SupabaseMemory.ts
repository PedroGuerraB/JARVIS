import type { JarvisSupabaseClient } from '@jarvis/db';

interface MemoryRow {
  value: unknown;
  expires_at: string | null;
}

export class SupabaseMemory {
  constructor(private db: JarvisSupabaseClient) {}

  async get<T = unknown>(key: string, scope = 'global'): Promise<T | null> {
    const { data } = await this.db
      .from('shared_memory')
      .select('value, expires_at')
      .eq('key', key)
      .eq('scope', scope)
      .single();

    if (!data) return null;
    const row = data as unknown as MemoryRow;
    if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
    return row.value as T;
  }

  async set(key: string, value: unknown, scope = 'global', ttlSeconds?: number): Promise<void> {
    const expires_at = ttlSeconds
      ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
      : null;

    await this.db.from('shared_memory').upsert(
      { key, value: value as never, scope, expires_at } as never,
      { onConflict: 'key,scope' },
    );
  }

  async delete(key: string, scope = 'global'): Promise<void> {
    await this.db.from('shared_memory').delete().eq('key', key).eq('scope', scope);
  }
}
