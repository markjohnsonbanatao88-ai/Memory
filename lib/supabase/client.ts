"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicKey } from "@/lib/supabase/public-key";

const browserSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const browserSupabaseKey = getSupabasePublicKey();

export function hasSupabaseBrowserConfig() {
  return Boolean(browserSupabaseUrl && browserSupabaseKey);
}

export function createSupabaseBrowserClient() {
  if (!browserSupabaseUrl || !browserSupabaseKey) {
    throw new Error("Missing public Supabase browser configuration.");
  }

  return createBrowserClient<Database>(browserSupabaseUrl, browserSupabaseKey);
}
