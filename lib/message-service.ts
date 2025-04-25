import { getSupabaseClient } from "./supabase-client"

export type Message = {
  id: string
  contact_id: string | null
  campaign_id: string | null
  message: string
  status: "sent" | "delivered" | "failed" | "received"
  sent_at: string | null
  created_at: string
  contact?: {
    name: string
    phone: string
  }
}

export async function getMessages(): Promise<Message[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("messages")
      .select("*, contact:contact_id(name, phone)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching messages:", error)
      // Return empty array on error
      return []
    }

    return data // Return fetched data (might be empty)
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    // Return empty array on error
    return []
  }
}

export async function getRecentMessages(limit = 5): Promise<Message[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("messages")
      .select("*, contact:contact_id(name, phone)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent messages:", error)
      // Return empty array on error
      return []
    }

    return data // Return fetched data (might be empty)
  } catch (error) {
    console.error("Failed to fetch recent messages:", error)
    // Return empty array on error
    return []
  }
}

export async function createMessage(message: Omit<Message, "id" | "created_at">): Promise<Message> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("messages")
      .insert({
        ...message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      // Throw the error to be handled by the caller
      throw error
    }

    // The caller (likely an API route) will handle the response
    return data
  } catch (error) {
    console.error("Failed to create message:", error)
    // Throw the error to be handled by the caller
    throw error
  }
}
