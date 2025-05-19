import { generateAIContent } from "./ai-helpers"
import { createMessage } from "./message-service"
import { getContact } from "./contact-service"
import { getUserSettings } from "./settings-service"
import { sendSMSServer } from "./nextsms-api"
import { getUserCredentials } from "./credentials-service"

export type AutoReplyOptions = {
  incomingMessage: string
  contactId: string | null
  contactPhone: string
  auth: string
  openrouterApiKey: string
}

export async function generateAutoReply({
  incomingMessage,
  contactId,
  contactPhone,
  auth,
  openrouterApiKey,
}: AutoReplyOptions): Promise<string | null> {
  try {
    // Check if auto-reply is enabled in settings
    const settings = await getUserSettings()
    if (!settings.aiAutoReply) {
      console.log("Auto-reply is disabled in settings")
      return null
    }

    // Get contact details if available
    let contactName = "Customer"
    if (contactId) {
      const contact = await getContact(contactId)
      if (contact) {
        contactName = contact.name
      }
    }

    // Generate AI response with business context
    const prompt = `
      The following is an SMS message from a customer: "${incomingMessage}"
      
      Generate a helpful, friendly, and concise response (under 160 characters) that addresses their message.
      If they're asking about products, mention our products.
      If they're asking about pricing, be helpful but encourage them to visit our website for the most up-to-date information.
      If they're expressing frustration, be empathetic and offer to connect them with customer service.
      
      Remember this is for ${contactName} and keep it brief as this is an SMS.
    `

    const systemPrompt = `
      You are an AI assistant for ${settings.businessName}. Your job is to generate helpful SMS responses to customer inquiries.
      Keep responses under 160 characters when possible. Be friendly, professional, and concise.
      The business information: ${settings.businessName} - ${settings.slogan}
      Business type: ${settings.businessType}
      Products: ${settings.products}
      Description: ${settings.description}
    `

    const replyText = await generateAIContent({
      prompt,
      systemPrompt,
      apiKey: openrouterApiKey,
      businessContext: true,
    })

    return replyText
  } catch (error) {
    console.error("Error generating auto-reply:", error)
    return null
  }
}

export async function handleIncomingMessage(message: {
  id: string
  contact_id: string | null
  message: string
  from: string
  auth: string
  openrouterApiKey: string
}): Promise<void> {
  try {
    // Check if auto-reply is enabled in settings
    const settings = await getUserSettings()
    if (!settings.aiAutoReply) {
      console.log("Auto-reply is disabled in settings")
      return
    }

    // Get credentials for sender ID
    const { credentials } = await getUserCredentials()
    if (!credentials.sender_id) {
      console.error("No sender ID configured")
      return
    }

    // Generate auto-reply
    const autoReply = await generateAutoReply({
      incomingMessage: message.message,
      contactId: message.contact_id,
      contactPhone: message.from,
      auth: message.auth,
      openrouterApiKey: message.openrouterApiKey,
    })

    if (!autoReply) {
      console.log("No auto-reply generated")
      return
    }

    // Send the auto-reply
    try {
      await sendSMSServer({
        from: credentials.sender_id,
        to: message.from,
        text: autoReply,
        auth: message.auth,
      })

      console.log(`Auto-reply sent to ${message.from}: ${autoReply}`)
    } catch (error) {
      console.error("Failed to send auto-reply SMS:", error)
    }

    // Save the auto-reply message
    try {
      await createMessage({
        contact_id: message.contact_id,
        campaign_id: null,
        message: autoReply,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to save auto-reply message to database:", error)
    }
  } catch (error) {
    console.error("Error handling incoming message:", error)
  }
}
