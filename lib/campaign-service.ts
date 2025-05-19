import { createClient } from '@supabase/supabase-js'
import { sendSMSServer } from './nextsms-api'
import { getUserCredentials } from './credentials-service'
import { getContacts } from './contact-service'
import { createMessage } from './message-service'
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Campaign = {
  id: string
  name: string
  message: string
  status: 'draft' | 'sending' | 'completed' | 'failed'
  created_at: string
  sent_at: string | null
  total_contacts: number
  sent_count: number
  failed_count: number
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'sent_at' | 'total_contacts' | 'sent_count' | 'failed_count'>): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{
      ...campaign,
      total_contacts: 0,
      sent_count: 0,
      failed_count: 0
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function sendCampaign(campaignId: string): Promise<void> {
  try {
    // Get credentials for sender ID
    const { credentials } = await getUserCredentials()
    if (!credentials.sender_id) {
      throw new Error('No sender ID configured')
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError) throw campaignError
    if (!campaign) throw new Error('Campaign not found')

    // Update campaign status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)

    // Get all contacts
    const contacts = await getContacts()
    const totalContacts = contacts.length

    // Update total contacts count
    await supabase
      .from('campaigns')
      .update({ total_contacts: totalContacts })
      .eq('id', campaignId)

    // Send messages to all contacts
    let sentCount = 0
    let failedCount = 0

    for (const contact of contacts) {
      try {
        // Send message
        await sendSMSServer({
          from: credentials.sender_id,
          to: contact.phone,
          text: campaign.message,
          auth: credentials.api_key
        })

        // Create message record
        await createMessage({
          contact_id: contact.id,
          campaign_id: campaignId,
          message: campaign.message,
          status: 'sent',
          sent_at: new Date().toISOString()
        })

        sentCount++
      } catch (error) {
        console.error(`Failed to send message to ${contact.phone}:`, error)
        
        // Create failed message record
        await createMessage({
          contact_id: contact.id,
          campaign_id: campaignId,
          message: campaign.message,
          status: 'failed',
          sent_at: null
        })

        failedCount++
      }

      // Update campaign progress
      await supabase
        .from('campaigns')
        .update({
          sent_count: sentCount,
          failed_count: failedCount
        })
        .eq('id', campaignId)
    }

    // Update campaign status to completed
    await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)
  } catch (error) {
    // Update campaign status to failed
    await supabase
      .from('campaigns')
      .update({ status: 'failed' })
      .eq('id', campaignId)
    throw error
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
