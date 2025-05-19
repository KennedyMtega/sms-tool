import { NextResponse } from "next/server";
import { createCampaign } from "@/lib/campaign-service";
import { getSupabaseClient } from "@/lib/supabase-client";
import { sendBulkSMS, sendSMS } from "@/lib/nextsms-service";
import { replacePersonalizationVariables } from "@/lib/personalization";
import { NextSMSError } from "@/lib/nextsms-service";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    let { recipients, message, sender_id, status, scheduled_date, ...campaignData } = data;
    const supabase = getSupabaseClient();
    // Fetch sender_id from settings if not provided
    if (!sender_id) {
      const { data: settings } = await supabase.from("settings").select("senderId").single();
      sender_id = settings?.senderId || "N-SMS";
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.error("No recipients provided");
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
    }
    if (!message) {
      console.error("Missing message");
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }
    // Validate recipients structure
    const validRecipients = recipients.filter(r => r && r.phone && r.id && r.name);
    if (validRecipients.length === 0) {
      console.error("Recipients missing phone, id, or name", recipients);
      return NextResponse.json({ error: "Recipients missing phone, id, or name" }, { status: 400 });
    }
    // Save campaign to Supabase
    let campaign;
    try {
      campaign = await createCampaign({ ...campaignData, sender_id, status, scheduled_date, message });
    } catch (err: any) {
      console.error("Failed to create campaign:", err);
      return NextResponse.json({ error: err.message || "Failed to create campaign" }, { status: 500 });
    }
    // Save recipients to campaign_recipients table for scheduled campaigns
    try {
      const recipientRows = validRecipients.map((r: any) => ({
        campaign_id: campaign.id,
        contact_id: r.id,
        phone: r.phone,
      }));
      await supabase.from("campaign_recipients").insert(recipientRows);
    } catch (err: any) {
      console.error("Failed to save recipients:", err.message || err);
      return NextResponse.json({ error: err.message || "Failed to save recipients" }, { status: 500 });
    }
    // Send messages
    try {
      if (validRecipients.length === 1) {
        // Single recipient - use single SMS
        const personalizedMessage = replacePersonalizationVariables(message, validRecipients[0]);
        await sendSMS({
          to: validRecipients[0].phone,
          message: personalizedMessage,
          metadata: {
            campaignId: campaign.id,
            contactId: validRecipients[0].id
          }
        });
      } else {
        // Multiple recipients - use bulk SMS
        const messages = validRecipients.map(recipient => ({
          to: recipient.phone,
          message: replacePersonalizationVariables(message, recipient),
          metadata: {
            campaignId: campaign.id,
            contactId: recipient.id
          }
        }));
        await sendBulkSMS(messages);
      }

      return NextResponse.json({ success: true, campaign });
    } catch (error: any) {
      console.error("Failed to send campaign messages:", error);
      
      // Update campaign status to failed
      await supabase
        .from("campaigns")
        .update({ status: "failed" })
        .eq("id", campaign.id);

      if (error instanceof NextSMSError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || "Failed to send campaign messages" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Campaign creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
} 