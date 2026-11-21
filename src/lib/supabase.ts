import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

// Publishable key is the recommended browser key. The legacy anon key
// remains supported for projects that have not migrated their API keys.
const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key
  ? createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
