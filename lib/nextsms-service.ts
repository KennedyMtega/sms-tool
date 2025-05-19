import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Constants for NextSMS credentials
const NEXTSMS_USERNAME = "Kentstudiostz"
const NEXTSMS_PASSWORD = "Helphelp@2023"

// Create Basic auth token
const NEXTSMS_AUTH = `Basic ${Buffer.from(`${NEXTSMS_USERNAME}:${NEXTSMS_PASSWORD}`).toString('base64')}`

export interface NextSMSCredentials {
  nextsms_username: string
  nextsms_password: string
  nextsms_auth: string
  sender_id: string
}

export interface NextSMSMessageMetadata {
  campaignId?: string
  contactId?: string
  [key: string]: string | undefined
}

export interface NextSMSResult {
  success: boolean
  to: string
  error?: string
  messageId?: string
  metadata?: NextSMSMessageMetadata
  message: string
}

export class NextSMSError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NextSMSError"
  }
}

export async function getNextSMSCredentials(): Promise<NextSMSCredentials> {
  const supabase = createClient()

  try {
    // First try to get credentials from the user_credentials table
    const { data: credentials, error } = await supabase
      .from("user_credentials")
      .select("nextsms_username, nextsms_password, nextsms_auth, sender_id")
      .single()

    if (error) {
      console.error("Error fetching credentials:", error)
      // If no credentials found, use the default credentials
      return {
        nextsms_username: NEXTSMS_USERNAME,
        nextsms_password: NEXTSMS_PASSWORD,
        nextsms_auth: NEXTSMS_AUTH,
        sender_id: "BBASPA" // Default sender ID
      }
    }

    if (!credentials) {
      throw new NextSMSError("No credentials found in database")
    }

    // If we have credentials but no auth token, generate one
    if (!credentials.nextsms_auth && credentials.nextsms_username && credentials.nextsms_password) {
      const auth = `Basic ${Buffer.from(`${credentials.nextsms_username}:${credentials.nextsms_password}`).toString('base64')}`
      return {
        nextsms_username: credentials.nextsms_username,
        nextsms_password: credentials.nextsms_password,
        nextsms_auth: auth,
        sender_id: credentials.sender_id || "BBASPA"
      }
    }

    // Return the credentials we found
    return {
      nextsms_username: credentials.nextsms_username || "",
      nextsms_password: credentials.nextsms_password || "",
      nextsms_auth: credentials.nextsms_auth || NEXTSMS_AUTH,
      sender_id: credentials.sender_id || "BBASPA"
    }
  } catch (error) {
    console.error("Error in getNextSMSCredentials:", error)
    // Fallback to default credentials if something goes wrong
    return {
      nextsms_username: NEXTSMS_USERNAME,
      nextsms_password: NEXTSMS_PASSWORD,
      nextsms_auth: NEXTSMS_AUTH,
      sender_id: "BBASPA"
    }
  }
}

export async function formatPhoneNumber(phone: string): Promise<string> {
  let formattedPhone = phone.trim().replace(/\s+/g, "")
  if (!formattedPhone.startsWith("+") && formattedPhone.length < 12) {
    if (!formattedPhone.startsWith("255")) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "255" + formattedPhone.substring(1)
      } else {
        formattedPhone = "255" + formattedPhone
      }
    }
  }
  return formattedPhone
}

export async function sendSMS(params: {
  to: string
  message: string
  metadata?: NextSMSMessageMetadata
}): Promise<{ messageId: string }> {
  // Format phone number
  const formattedPhone = await formatPhoneNumber(params.to)
  const credentials = await getNextSMSCredentials()

  if (!credentials.sender_id) {
    throw new NextSMSError("Sender ID not configured. Please set it in your settings.")
  }

  const response = await fetch("https://messaging-service.co.tz/api/sms/v1/text/single", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": credentials.nextsms_auth
    },
    body: JSON.stringify({
      from: credentials.sender_id,
      to: formattedPhone,
      text: params.message
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData
    try {
      errorData = JSON.parse(errorText)
    } catch (e) {
      errorData = { error: errorText || "Unknown error" }
    }

    // Handle specific error cases
    switch(errorData.error) {
      case "REJECTED_NOT_ENOUGH_CREDITS":
        throw new NextSMSError("Not enough SMS credits. Please top up your account.")
      case "REJECTED_SENDER":
        throw new NextSMSError("Sender ID has been blacklisted. Please use a different sender ID.")
      case "REJECTED_DESTINATION":
        throw new NextSMSError("Destination number is blacklisted.")
      case "REJECTED_INVALID_DESTINATION":
        throw new NextSMSError("Invalid phone number format.")
      default:
        if (response.status === 401) {
          throw new NextSMSError("Authentication failed. Please check your API credentials.")
        }
        throw new NextSMSError(errorData.error || errorData.details || "Failed to send SMS")
    }
  }

  const data = await response.json()
  
  // Save message to database
  const supabase = createClient()
  const { error: insertError } = await supabase
    .from("messages")
    .insert({
      contact_id: params.metadata?.contactId,
      campaign_id: params.metadata?.campaignId,
      message: params.message,
      status: "sent",
      sent_at: new Date().toISOString(),
      nextsms_message_id: data.messageId,
    })

  if (insertError) {
    console.error("Failed to save message to database:", insertError)
  }

  return { messageId: data.messageId }
}

export interface BulkSMSMessage {
  to: string
  message: string
  metadata?: NextSMSMessageMetadata
}

export interface BulkSMSResult {
  total: number
  successful: number
  failed: number
  results: NextSMSResult[]
}

export async function sendBulkSMS(messages: BulkSMSMessage[]): Promise<BulkSMSResult> {
  // Process messages in batches of 10 with rate limiting
  const BATCH_SIZE = 10
  const DELAY_BETWEEN_BATCHES = 1000 // 1 second

  const credentials = await getNextSMSCredentials()
  if (!credentials.sender_id) {
    throw new NextSMSError("Sender ID not configured. Please set it in your settings.")
  }

  const results: NextSMSResult[] = []
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE)
    
    // Process batch
    const batchPromises = batch.map(async (msg) => {
      try {
        const formattedPhone = await formatPhoneNumber(msg.to)

        const response = await fetch("https://messaging-service.co.tz/api/sms/v1/text/single", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": credentials.nextsms_auth
          },
          body: JSON.stringify({
            from: credentials.sender_id,
            to: formattedPhone,
            text: msg.message
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            errorData = { error: errorText || "Unknown error" }
          }

          return {
            success: false,
            to: formattedPhone,
            error: errorData.error || errorData.details || `Failed to send SMS (${response.status})`,
            metadata: msg.metadata,
            message: msg.message
          }
        }

        const data = await response.json()

        // Save message to database
        const supabase = createClient()
        const { error: insertError } = await supabase
          .from("messages")
          .insert({
            contact_id: msg.metadata?.contactId,
            campaign_id: msg.metadata?.campaignId,
            message: msg.message,
            status: "sent",
            sent_at: new Date().toISOString(),
            nextsms_message_id: data.messageId,
          })

        if (insertError) {
          console.error("Failed to save message to database:", insertError)
        }

        return {
          success: true,
          to: formattedPhone,
          messageId: data.messageId,
          metadata: msg.metadata,
          message: msg.message
        }
      } catch (error) {
        return {
          success: false,
          to: msg.to,
          error: error instanceof Error ? error.message : "Unknown error",
          metadata: msg.metadata,
          message: msg.message
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Add delay between batches if not the last batch
    if (i + BATCH_SIZE < messages.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  const successful = results.filter(r => r.success).length
  return {
    total: messages.length,
    successful,
    failed: messages.length - successful,
    results
  }
} 