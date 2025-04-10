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

// Sample data to use when Supabase is not available
const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    contact_id: "1",
    campaign_id: "1",
    message: "Thank you for the discount offer!",
    status: "received",
    sent_at: new Date(Date.now() - 5 * 60000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    contact: {
      name: "John Doe",
      phone: "255712345678",
    },
  },
  {
    id: "2",
    contact_id: "2",
    campaign_id: null,
    message: "When will the new products be available?",
    status: "received",
    sent_at: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    contact: {
      name: "Jane Smith",
      phone: "255723456789",
    },
  },
  {
    id: "3",
    contact_id: "1",
    campaign_id: "1",
    message: "Your order #12345 has been shipped and will arrive tomorrow.",
    status: "sent",
    sent_at: new Date(Date.now() - 60 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    contact: {
      name: "John Doe",
      phone: "255712345678",
    },
  },
]

export async function getMessages(): Promise<Message[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("messages")
      .select("*, contact:contact_id(name, phone)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching messages:", error)
      return SAMPLE_MESSAGES
    }

    return data.length > 0 ? data : SAMPLE_MESSAGES
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return SAMPLE_MESSAGES
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
      return SAMPLE_MESSAGES.slice(0, limit)
    }

    return data.length > 0 ? data : SAMPLE_MESSAGES.slice(0, limit)
  } catch (error) {
    console.error("Failed to fetch recent messages:", error)
    return SAMPLE_MESSAGES.slice(0, limit)
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
      // Return a mock response with a generated ID
      return {
        id: Math.random().toString(36).substring(2, 11),
        ...message,
        created_at: new Date().toISOString(),
      }
    }

    return data
  } catch (error) {
    console.error("Failed to create message:", error)
    // Return a mock response with a generated ID
    return {
      id: Math.random().toString(36).substring(2, 11),
      ...message,
      created_at: new Date().toISOString(),
    }
  }
}
