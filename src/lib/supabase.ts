// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""; // server-side privileged key (storage, admin)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ""; // public/anon key (frontend-safe)

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.warn(
    "Warning: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY is not set. File uploads and public client may not work.",
  );
}

// Use service role key for server-side operations (uploads, admin tasks)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional public client (not currently used server-side, safe for client contexts)
export const supabasePublic = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "image";
