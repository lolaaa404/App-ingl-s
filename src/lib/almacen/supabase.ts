import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function obtenerCredenciales() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url: url.trim(), key: key.trim() };
}

let clienteSupabase: SupabaseClient | null = null;

export function esSupabaseConfigurado(): boolean {
  return obtenerCredenciales() !== null;
}

export function obtenerClienteSupabase(): SupabaseClient | null {
  if (clienteSupabase) return clienteSupabase;
  const creds = obtenerCredenciales();
  if (!creds) return null;

  clienteSupabase = createClient(creds.url, creds.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return clienteSupabase;
}
