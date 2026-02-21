// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. File uploads will not work.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "image";
