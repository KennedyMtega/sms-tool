import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

// This route handles incoming webhook requests from NextSMS to update message statuses.
// You need to configure this URL (e.g., https://your-domain.com/api/sms/status-update)
// in your NextSMS account settings for Delivery Reports (DLR).

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming request body from NextSMS
    // IMPORTANT: The structure of the payload depends on NextSMS's webhook format.
    // You need to consult the NextSMS documentation for the exact payload structure.
    // Example (assuming a JSON payload):
    const payload = await req.json();
    console.log("Received NextSMS Webhook Payload:", JSON.stringify(payload, null, 2));

    // 2. Extract necessary information
    // Adjust these based on the actual NextSMS payload structure:
    const messageId = payload?.messageId; // The ID NextSMS assigned to the message
    const status = payload?.status; // e.g., "DELIVERED", "FAILED", "UNDELIVERABLE"
    const errorCode = payload?.errorCode; // Optional error code if failed
    const timestamp = payload?.timestamp; // Timestamp of the status update

    if (!messageId || !status) {
      console.error("Webhook payload missing required fields (messageId or status)");
      return NextResponse.json({ error: 'Missing required fields in webhook payload' }, { status: 400 });
    }

    // 3. Map NextSMS status to your application's status enum
    let dbStatus: "sent" | "delivered" | "failed" | "received";
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'DELIVRD': // Common abbreviation
        dbStatus = 'delivered';
        break;
      case 'FAILED':
      case 'UNDELIVERABLE':
      case 'REJECTED': // Common failure statuses
        dbStatus = 'failed';
        break;
      // Add other mappings as needed based on NextSMS documentation
      default:
        console.warn(`Received unhandled NextSMS status: ${status}`);
        // Decide how to handle unknown statuses - maybe ignore or log differently
        return NextResponse.json({ message: 'Status received but not processed' }, { status: 200 }); // Acknowledge receipt
    }

    // 4. Update the message status in your Supabase database
    const supabase = getSupabaseClient();

    // IMPORTANT: You need a way to link the NextSMS messageId back to your message record.
    // Option A: If you store the NextSMS messageId in your 'messages' table when sending:
    // const { error: updateError } = await supabase
    //   .from('messages')
    //   .update({ status: dbStatus /*, delivered_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString() */ }) // Add delivered_at if needed
    //   .eq('nextsms_message_id', messageId); // Assuming you have a 'nextsms_message_id' column

    // Option B: If NextSMS includes *your* internal message ID in the webhook (less common):
    const { error: updateError } = await supabase
      .from('messages')
      .update({ status: dbStatus /*, delivered_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString() */ }) // Add delivered_at if needed
      .eq('id', messageId); // Assuming NextSMS sends back *your* DB message ID

    // Choose Option A or B based on how you store IDs and what NextSMS provides.
    // For now, assuming Option B (NextSMS sends back your DB ID 'id')

    if (updateError) {
      console.error(`Error updating message status in DB for ID ${messageId}:`, updateError);
      // Decide if you should return an error to NextSMS. Usually, you still return 200 OK
      // to acknowledge receipt, even if DB update fails, to prevent retries.
      // Log the error thoroughly for debugging.
    } else {
      console.log(`Successfully updated status for message ID ${messageId} to ${dbStatus}`);
    }

    // 5. Respond to NextSMS
    // It's crucial to respond with a 200 OK quickly to acknowledge receipt of the webhook.
    // Failure to do so might cause NextSMS to retry sending the webhook.
    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing NextSMS webhook:", error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ error: "Invalid request body. Ensure it's valid JSON." }, { status: 400 });
    }
    // Return 500 for other unexpected errors, but NextSMS might retry.
    // Consider returning 200 even on errors after logging to prevent retries.
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
