import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a singleton Supabase client for client-side usage
let supabaseClient: SupabaseClient<Database> | null = null

export class SupabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupabaseError"
  }
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new SupabaseError("Missing Supabase environment variables")
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseClient
}

// Server-side Supabase client (for server components and API routes)
export function getServerSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new SupabaseError("Missing Supabase server environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}
