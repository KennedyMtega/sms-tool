import { NextResponse } from "next/server"
import { createMessage } from "@/lib/message-service"
import { handleIncomingMessage } from "@/lib/auto-reply"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { message, from, to } = await req.json()

    // Get credentials from cookies
    const cookieStore = cookies()
    const credentialsCookie = cookieStore.get("sms_marketing_credentials")
    let auth = ""
    let openrouterApiKey = ""

    if (credentialsCookie) {
      try {
        const credentials = JSON.parse(credentialsCookie.value)
        auth = credentials.nextsmsAuth || ""
        openrouterApiKey = credentials.openrouterApiKey || ""
      } catch (e) {
        console.error("Failed to parse credentials cookie:", e)
      }
    }

    // Fallback to environment variable if cookie not available
    if (!auth) {
      auth = process.env.NEXTSMS_AUTH || ""
    }

    // Create a record of the incoming message
    const newMessage = await createMessage({
      contact_id: null, // In a real app, you would look up the contact by phone number
      campaign_id: null,
      message,
      status: "received",
      sent_at: new Date().toISOString(),
    })

    // Process auto-reply if credentials are available
    if (auth && openrouterApiKey) {
      // Handle the incoming message asynchronously
      handleIncomingMessage({
        id: newMessage.id,
        contact_id: newMessage.contact_id,
        message,
        from,
        auth,
        openrouterApiKey,
      }).catch((error) => {
        console.error("Error in auto-reply:", error)
      })
    }

    return NextResponse.json({
      success: true,
      message: "Message received successfully",
    })
  } catch (error: any) {
    console.error("Error in SMS receive route:", error)
    return NextResponse.json(
      {
        error: "Failed to process incoming message",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
