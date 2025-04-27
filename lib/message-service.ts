import { createClient } from "@/lib/supabase/server"
import { Message } from "./types"

export async function getMessages(): Promise<Message[]> {
  const supabase = createClient()

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      *,
      contact:contacts (
        id,
        name,
        phone
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return messages || []
}

export async function getMessage(id: string): Promise<Message | null> {
  const supabase = createClient()

  const { data: message, error } = await supabase
    .from("messages")
    .select(`
      *,
      contact:contacts (
        id,
        name,
        phone
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching message:", error)
    return null
  }

  return message
}

export async function getRecentMessages(limit = 5): Promise<Message[]> {
  try {
    const supabase = createClient()

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
    const supabase = createClient()

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

// Fetch only the latest message per recipient, paginated, with contact info
export async function getConversations({ limit = 20, offset = 0 } = {}): Promise<any[]> {
  const supabase = createClient()

  // Use a SQL query to get the latest message per contact (recipient) and join contacts
  const { data, error } = await supabase.rpc('latest_messages_per_contact', { limit_param: limit, offset_param: offset })

  if (error) {
    console.error("Error fetching conversations:", error)
    return []
  }

  // For each message, fetch contact info if not already included
  // If your RPC already joins contacts, you can skip this
  // Otherwise, map and fetch contact info here (or adjust the RPC to join contacts)
  return data || []
}
