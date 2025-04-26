import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

// This route handles incoming webhook requests from NextSMS to update message statuses.
// You need to configure this URL (e.g., https://your-domain.com/api/sms/status-update)
// in your NextSMS account settings for Delivery Reports (DLR).

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = getSupabaseClient();

    // Extract message details from payload
    const messageId = payload?.messageId;
    const status = payload?.status;
    const timestamp = payload?.timestamp || new Date().toISOString();

    if (!messageId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields in webhook payload' },
        { status: 400 }
      );
    }

    // Map NextSMS status to our status
    let dbStatus: "sent" | "delivered" | "failed" | "received";
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'DELIVRD':
        dbStatus = 'delivered';
        break;
      case 'FAILED':
      case 'UNDELIVERABLE':
      case 'REJECTED':
        dbStatus = 'failed';
        break;
      default:
        console.warn(`Received unhandled NextSMS status: ${status}`);
        return NextResponse.json(
          { message: 'Status received but not processed' },
          { status: 200 }
        );
    }

    // Update message status in database
    await supabase
      .from('messages')
      .update({
        status: dbStatus,
        updated_at: timestamp
      })
      .eq('id', messageId);

    // If this was part of a campaign, update campaign_contacts
    const { data: message } = await supabase
      .from('messages')
      .select('campaign_id, contact_id')
      .eq('id', messageId)
      .single();

    if (message?.campaign_id && message?.contact_id) {
      await supabase
        .from('campaign_contacts')
        .update({
          status: dbStatus,
          delivered_at: dbStatus === 'delivered' ? timestamp : null
        })
        .match({
          campaign_id: message.campaign_id,
          contact_id: message.contact_id
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
