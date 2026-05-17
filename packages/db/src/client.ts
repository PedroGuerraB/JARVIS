import { createClient as _createClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const createClient = () =>
  _createClient<Database>(url, key, {
    auth: { persistSession: false },
  });

export type JarvisSupabaseClient = ReturnType<typeof createClient>;
