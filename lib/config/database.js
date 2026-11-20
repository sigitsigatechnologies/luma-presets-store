import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

const SUPABASE_URL = (config.supabase.url || process.env.SUPABASE_URL || "").trim();
const SUPABASE_KEY = (
  config.supabase.serviceRoleKey ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  config.supabase.anonKey ||
  process.env.SUPABASE_ANON_KEY ||
  ""
).trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠️ SUPABASE_URL atau SUPABASE_KEY belum terkonfigurasi!");
}

function getSupabaseClient() {
  if (globalThis.__luma_supabase_client) {
    return globalThis.__luma_supabase_client;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  globalThis.__luma_supabase_client = client;
  return client;
}

export const db = getSupabaseClient();
