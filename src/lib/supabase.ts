import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseCreds } from '@/lib/env';
import { localClient } from '@/lib/localClient';

export { isSupabaseConfigured };

/**
 * Switch automatico:
 *  - credenziali valide  -> vero client Supabase (produzione)
 *  - altrimenti          -> client demo locale su localStorage (stessa interfaccia)
 * Le pagine e gli hook usano `supabase` senza sapere quale dei due è attivo.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseCreds.url, supabaseCreds.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : (localClient as unknown as SupabaseClient);
