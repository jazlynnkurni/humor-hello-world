import { createClient } from "@supabase/supabase-js";

// Read from environment variables only. Nothing is hardcoded here.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder",
);

export type Joke = {
  id: number;
  setup: string;
  punchline: string;
  rating: number;
  created_at: string;
};
