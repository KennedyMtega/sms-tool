import { getSupabaseClient } from "./supabase-client"
import { sendBulkSMS, type BulkSMSMessage, type BulkSMSResult } from "./nextsms-service"
import type { Database } from "@/types/supabase"

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"]
export type MessageStatus = "sent" | "delivered" | "failed" | "received"
export type CampaignResult = BulkSMSResult

export class CampaignError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CampaignError"
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new CampaignError(`Failed to fetch campaigns: ${error.message}`)
  return data || []
}

export async function getCampaign(id: string): Promise<Campaign> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new CampaignError(`Failed to fetch campaign: ${error.message}`)
  if (!data) throw new CampaignError("Campaign not found")
  return data
}

export async function createCampaign(
  campaign: Omit<Campaign, "id" | "created_at" | "updated_at" | "sent_count" | "delivered_count" | "response_count">
): Promise<Campaign> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      ...campaign,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sent_count: 0,
      delivered_count: 0,
      response_count: 0,
    })
    .select()
    .single()

  if (error) throw new CampaignError(`Failed to create campaign: ${error.message}`)
  if (!data) throw new CampaignError("Failed to create campaign: No data returned")
  return data
}

export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, "id" | "created_at">>
): Promise<Campaign> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new CampaignError(`Failed to update campaign: ${error.message}`)
  if (!data) throw new CampaignError("Campaign not found")
  return data
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = getSupabaseClient()

  const { error: contactsError } = await supabase
    .from("campaign_contacts")
    .delete()
    .eq("campaign_id", id)

  if (contactsError) {
    throw new CampaignError(`Failed to delete campaign contacts: ${contactsError.message}`)
  }

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)

  if (error) throw new CampaignError(`Failed to delete campaign: ${error.message}`)
}

export async function sendCampaignMessages(
  campaignId: string,
  recipients: Array<{ id: string; phone: string; name?: string }>,
  message: string,
  senderId: string
): Promise<CampaignResult> {
  if (!recipients?.length) {
    throw new CampaignError("No recipients provided")
  }

  // Format messages for bulk sending
  const messages: BulkSMSMessage[] = recipients.map((recipient) => ({
    to: recipient.phone,
    message: message,
    senderId: senderId,
    metadata: {
      campaignId,
      contactId: recipient.id
    }
  }))

  // Send messages using NextSMS service
  const result = await sendBulkSMS(messages)

  // Update campaign stats
  await updateCampaignStats(campaignId, result, senderId)
  return result
}

async function updateCampaignStats(
  campaignId: string,
  result: CampaignResult,
  senderId: string
): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error: updateError } = await supabase
    .from("campaigns")
    .update({
      sent_count: result.total,
      delivered_count: result.successful,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)

  if (updateError) {
    throw new CampaignError(`Failed to update campaign stats: ${updateError.message}`)
  }

  const messages = result.results.map((r) => ({
    campaign_id: campaignId,
    contact_id: r.metadata?.contactId,
    message: r.message,
    status: r.success ? ("sent" as const) : ("failed" as const),
    sent_at: new Date().toISOString(),
    nextsms_message_id: r.messageId,
  }))

  const { error: insertError } = await supabase
    .from("messages")
    .insert(messages)

  if (insertError) {
    throw new CampaignError(`Failed to insert messages: ${insertError.message}`)
  }
}
