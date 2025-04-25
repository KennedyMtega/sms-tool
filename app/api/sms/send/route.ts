import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createMessage } from '@/lib/message-service'; // Import createMessage
import { getContactByPhone } from '@/lib/contact-service'; // Import getContactByPhone

// Helper function to get credentials from cookie
async function getCredentialsFromCookie(): Promise<{ nextsmsAuth: string } | null> { // Make async
  const cookieStore = await cookies(); // Await cookies()
  const credentialsCookie = cookieStore.get("sms_marketing_credentials");

  if (credentialsCookie) {
    try {
      const credentials = JSON.parse(credentialsCookie.value);
      return { nextsmsAuth: credentials.nextsmsAuth || "" };
    } catch (e) {
      console.error("Failed to parse credentials cookie:", e);
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { payload, auth: requestAuth } = await req.json(); // Expect 'auth' in the body now

    // 1. Get Auth Token (prioritize request body, then cookie)
    let auth = requestAuth || "";
    if (!auth) {
      const cookieCredentials = await getCredentialsFromCookie(); // Await helper
      if (cookieCredentials) {
        auth = cookieCredentials.nextsmsAuth;
      }
    }

    // 2. Validate Auth Token
    if (!auth || !auth.startsWith('Basic ')) {
      return NextResponse.json({ error: 'Invalid or missing authentication token format. Must start with "Basic ".' }, { status: 401 });
    }

    // 3. Format Phone Number (E.164)
    let formattedPhone = payload.to.trim().replace(/\s+/g, "");
    if (!formattedPhone.startsWith("+") && formattedPhone.length < 12) {
      if (!formattedPhone.startsWith("255")) {
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "255" + formattedPhone.substring(1);
        } else {
          formattedPhone = "255" + formattedPhone;
        }
      }
    }

    // 4. Validate Sender ID (alphanumeric, max 11 chars)
    const validSenderId = payload.from.substring(0, 11).replace(/[^a-zA-Z0-9]/g, '');

    // 5. Prepare API Payload
    const apiPayload = {
      from: validSenderId,
      to: formattedPhone,
      text: payload.text,
    };

    // 6. Call NextSMS API (with specific network error handling)
    let response;
    try {
       response = await fetch('https://messaging-service.co.tz/api/sms/v1/text/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': auth // Use the validated auth token
        },
        body: JSON.stringify(apiPayload)
      });
    } catch (networkError: any) {
      console.error("Network error sending NextSMS message:", networkError);
      return NextResponse.json({ error: 'Network error connecting to NextSMS API.', details: networkError.message }, { status: 503 }); // Service Unavailable
    } // <-- Correct closing brace placement

    // 7. Handle Response and Errors
    if (!response.ok) {
      let errorData;
      const errorText = await response.text();
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || "Unknown NextSMS API error" };
      }

      console.error("NextSMS API Error:", response.status, errorData);

      let errorMessage = 'Failed to send SMS';
      switch (errorData.error || errorData.message) {
        case 'REJECTED_NOT_ENOUGH_CREDITS':
          errorMessage = 'Not enough SMS credits. Please top up your account.';
          break;
        case 'REJECTED_SENDER':
          errorMessage = 'Sender ID has been blacklisted. Please use a different sender ID.';
          break;
        case 'REJECTED_DESTINATION':
          errorMessage = 'Destination number is blacklisted.';
          break;
        case 'REJECTED_INVALID_DESTINATION':
          errorMessage = 'Invalid phone number format. Ensure it uses E.164 format (e.g., 255712345678).';
          break;
        default:
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please check your API credentials.';
          } else {
            errorMessage = errorData.error || errorData.message || `NextSMS API Error (${response.status})`;
          }
      }
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: response.status });
    } else {
      // SMS Sent Successfully via NextSMS API
      const nextSmsResponseData = await response.json(); // Store the successful response

      // 8. Save message to Database (after successful send)
      try {
        // Find contact ID based on phone number
        const contact = await getContactByPhone(formattedPhone);
        const contactId = contact ? contact.id : null;

        // Save the message
        await createMessage({
          contact_id: contactId,
          campaign_id: null, // Assuming single message, not campaign
          message: payload.text,
          status: 'sent',
          sent_at: new Date().toISOString(),
          // created_at is handled by createMessage function
        });
        console.log(`Message to ${formattedPhone} saved to database.`);

      } catch (dbError: any) {
        // Log DB error but don't fail the request as SMS was sent
        console.error("Error saving sent message to database:", dbError);
        // Optionally, you could add specific handling or monitoring here
      }

      // Return the original successful NextSMS response
      return NextResponse.json(nextSmsResponseData);
    }

  } catch (error: any) {
    console.error("Error in /api/sms/send:", error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ error: "Invalid request body. Ensure it's valid JSON." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
