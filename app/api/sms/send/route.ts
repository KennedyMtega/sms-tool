import { NextResponse } from 'next/server';
import { sendSMS } from "@/lib/nextsms-service"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const { to, message, metadata } = await request.json()
    // No sender_id from client; always use settings
    const smsResult = await sendSMS({
      to,
      message,
      metadata
    })

    const supabase = getSupabaseClient()
    await supabase.from("messages").insert({
      contact_id: metadata?.contactId,
      message,
      status: "sent",
      sent_at: new Date().toISOString(),
      nextsms_message_id: smsResult.messageId,
      created_at: new Date().toISOString(),
      campaign_id: metadata?.campaignId || null,
    })

    return NextResponse.json(smsResult)
  } catch (error: any) {
    console.error("Error sending SMS:", error)
    return NextResponse.json({ error: error.message || "Failed to send SMS" }, { status: 500 })
  }
}
