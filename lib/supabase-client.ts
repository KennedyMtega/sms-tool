import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a singleton Supabase client for client-side usage
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  try {
    // Use environment variables if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Check if environment variables are available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables not found. Using mock client.")
      // Create a mock client that logs errors but doesn't crash
      const mockClient = {
        from: () => {
          console.warn("Supabase client not properly configured. Using mock data.")
          return {
            select: () => mockClient.from(),
            insert: () => mockClient.from(),
            update: () => mockClient.from(),
            delete: () => mockClient.from(),
            eq: () => mockClient.from(),
            order: () => mockClient.from(),
            limit: () => mockClient.from(),
            single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          }
        },
      } as any

      return mockClient
    }

    // Create the real client
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    return supabaseClient
  } catch (error) {
    console.error("Error initializing Supabase client:", error)

    // Return a mock client that won't crash the app
    const mockClient = {
      from: () => {
        console.warn("Supabase client initialization failed. Using mock data.")
        return {
          select: () => mockClient.from(),
          insert: () => mockClient.from(),
          update: () => mockClient.from(),
          delete: () => mockClient.from(),
          eq: () => mockClient.from(),
          order: () => mockClient.from(),
          limit: () => mockClient.from(),
          single: () => Promise.resolve({ data: null, error: new Error("Supabase initialization failed") }),
        }
      },
    } as any

    return mockClient
  }
}

// Server-side Supabase client (for server components and API routes)
export function getServerSupabaseClient() {
  try {
    // Use environment variables if available
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check if environment variables are available
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Server Supabase environment variables not found. Using mock client.")
      // Create a mock client that logs errors but doesn't crash
      const mockClient = {
        from: () => {
          console.warn("Server Supabase client not properly configured. Using mock data.")
          return {
            select: () => mockClient.from(),
            insert: () => mockClient.from(),
            update: () => mockClient.from(),
            delete: () => mockClient.from(),
            eq: () => mockClient.from(),
            order: () => mockClient.from(),
            limit: () => mockClient.from(),
            single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          }
        },
      } as any

      return mockClient
    }

    // Create the real client
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error initializing server Supabase client:", error)

    // Return a mock client that won't crash the app
    const mockClient = {
      from: () => {
        console.warn("Server Supabase client initialization failed. Using mock data.")
        return {
          select: () => mockClient.from(),
          insert: () => mockClient.from(),
          update: () => mockClient.from(),
          delete: () => mockClient.from(),
          eq: () => mockClient.from(),
          order: () => mockClient.from(),
          limit: () => mockClient.from(),
          single: () => Promise.resolve({ data: null, error: new Error("Supabase initialization failed") }),
        }
      },
    } as any

    return mockClient
  }
}
