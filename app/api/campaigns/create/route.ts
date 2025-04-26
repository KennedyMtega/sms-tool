import { NextResponse } from "next/server";
import { createCampaign } from "@/lib/campaign-service";
import { sendBulkSMS } from "@/lib/nextsms-service";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { recipients, message, sender_id, ...campaignData } = data;
    // Save campaign to Supabase
    const campaign = await createCampaign({ ...campaignData, sender_id });
    // Send SMS to recipients
    if (recipients && recipients.length > 0 && message && sender_id) {
      const smsMessages = recipients.map((r: any) => ({
        to: r.phone,
        message,
        senderId: sender_id,
        metadata: { campaignId: campaign.id, contactId: r.id }
      }));
      await sendBulkSMS(smsMessages);
    }
    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
} 