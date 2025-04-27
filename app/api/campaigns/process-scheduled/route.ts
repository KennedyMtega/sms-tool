import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";
import { sendBulkSMS } from "@/lib/nextsms-service";

export async function POST() {
  const supabase = getSupabaseClient();
  const now = new Date();
  // Fetch scheduled campaigns due for sending (date and time)
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "scheduled");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ processed: 0 });
  }
  let processed = 0;
  for (const campaign of campaigns) {
    if (!campaign.scheduled_date) continue;
    const scheduled = new Date(campaign.scheduled_date);
    if (scheduled > now) continue; // Only process if scheduled time has passed
    // Fetch recipients for this campaign
    const { data: recipients } = await supabase
      .from("campaign_recipients")
      .select("contact_id, phone")
      .eq("campaign_id", campaign.id);
    if (!recipients || recipients.length === 0) continue;
    // Send SMS
    const smsMessages = recipients.map((r: any) => ({
      to: r.phone,
      message: campaign.message,
      senderId: campaign.sender_id,
      metadata: { campaignId: campaign.id, contactId: r.contact_id }
    }));
    const smsResult = await sendBulkSMS(smsMessages);
    // Update campaign status and counts
    await supabase
      .from("campaigns")
      .update({
        status: "active",
        sent_count: smsResult.total,
        delivered_count: smsResult.successful,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
    processed++;
  }
  return NextResponse.json({ processed });
} 