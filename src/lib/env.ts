/** Rileva se sono presenti credenziali Supabase VALIDE (non placeholder/demo). */
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

const looksValidUrl = /^https:\/\/.+\.supabase\.(co|in)/.test(url);
const looksValidKey = key.length > 30 && !/placeholder|demo/i.test(key);

/** true = modalità produzione Supabase, false = modalità demo locale. */
export const isSupabaseConfigured = looksValidUrl && looksValidKey;

export const supabaseCreds = { url, key };
