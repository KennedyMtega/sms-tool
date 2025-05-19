import { createClient } from '@supabase/supabase-js'
import { sendSMSServer } from './nextsms-api'
import { getUserCredentials } from './credentials-service'
import { Message } from "./types"
export type { Message }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getMessages(contactId?: string): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (contactId) {
    query = query.eq('contact_id', contactId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getMessage(id: string): Promise<Message | null> {
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

export async function createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function sendMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
  try {
    // Get credentials for sender ID
    const { credentials } = await getUserCredentials()
    if (!credentials.sender_id) {
      throw new Error('No sender ID configured')
    }

    // Send the message
    await sendSMSServer({
      from: credentials.sender_id,
      to: message.contact_id || '',
      text: message.message,
      auth: credentials.api_key
    })

    // Create message record
    return await createMessage({
      ...message,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  } catch (error) {
    // Create failed message record
    const failedMessage = await createMessage({
      ...message,
      status: 'failed',
      sent_at: null
    })
    throw error
  }
}

// Fetch only the latest message per recipient, paginated, with contact info
export async function getConversations({ limit = 20, offset = 0 } = {}): Promise<any[]> {
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

export async function getCampaignMessages(campaignId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
