import { NextResponse } from "next/server";
import { createCampaign } from "@/lib/campaign-service";
import { getSupabaseClient } from "@/lib/supabase-client";
import { sendBulkSMS } from "@/lib/nextsms-service";

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
    const validRecipients = recipients.filter(r => r && r.phone && r.id);
    if (validRecipients.length === 0) {
      console.error("Recipients missing phone or id", recipients);
      return NextResponse.json({ error: "Recipients missing phone or id" }, { status: 400 });
    }
    // Save campaign to Supabase
    let campaign;
    try {
      campaign = await createCampaign({ ...campaignData, sender_id, status, scheduled_date, message });
    } catch (err: any) {
      console.error("Failed to create campaign:", err.message || err);
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
    // Send SMS immediately if not scheduled
    if (status === "active") {
      try {
        const smsMessages = validRecipients.map((r: any) => ({
          to: r.phone,
          message,
          senderId: sender_id,
          metadata: { campaignId: campaign.id, contactId: r.id }
        }));
        const smsResult = await sendBulkSMS(smsMessages);
        console.log("SMS sent result:", smsResult);
      } catch (err: any) {
        console.error("Failed to send SMS:", err.message || err);
        return NextResponse.json({ error: err.message || "Failed to send SMS" }, { status: 500 });
      }
    }
    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error("General error in campaign creation:", error.message || error);
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
} 