import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper function to get credentials from cookie
async function getCredentialsFromCookie(): Promise<{ nextsmsAuth: string } | null> {
  const cookieStore = await cookies();
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

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,  // Maximum requests per minute
  BATCH_SIZE: 10,               // Number of SMS to send in each batch
  DELAY_BETWEEN_BATCHES: 1000,  // Delay between batches in milliseconds
};

// Function to send a single SMS
async function sendSingleSMS(payload: any, auth: string) {
  try {
    // Format phone number to E.164
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

    // Validate sender ID (alphanumeric, max 11 chars)
    const validSenderId = payload.from.substring(0, 11).replace(/[^a-zA-Z0-9]/g, '');

    // Prepare API Payload
    const apiPayload = {
      from: validSenderId,
      to: formattedPhone,
      text: payload.text,
    };
    
    // Store metadata for tracking if provided
    const metadata = payload.metadata || {};

    // Call NextSMS API
    const response = await fetch('https://messaging-service.co.tz/api/sms/v1/text/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth
      },
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || "Unknown NextSMS API error" };
      }

      return {
        success: false,
        to: formattedPhone,
        error: errorData.error || errorData.message || `NextSMS API Error (${response.status})`,
        status: response.status,
        metadata: metadata // Include metadata in error response for tracking
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      to: formattedPhone,
      data: responseData,
      metadata: metadata // Include metadata in success response for tracking
    };
  } catch (error: any) {
    return {
      success: false,
      to: payload.to,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

// Process messages in batches with rate limiting
async function processBulkSMS(messages: any[], auth: string) {
  const results = [];
  const totalMessages = messages.length;
  
  // Process in batches
  for (let i = 0; i < totalMessages; i += RATE_LIMIT.BATCH_SIZE) {
    const batch = messages.slice(i, i + RATE_LIMIT.BATCH_SIZE);
    
    // Process each message in the current batch concurrently
    const batchPromises = batch.map(message => sendSingleSMS(message, auth));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // If there are more batches to process, add a delay to respect rate limits
    if (i + RATE_LIMIT.BATCH_SIZE < totalMessages) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
}

export async function POST(req: Request) {
  try {
    const { messages, auth: requestAuth } = await req.json();
    
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request. Expected an array of messages.' 
      }, { status: 400 });
    }
    
    // Get Auth Token (prioritize request body, then cookie)
    let auth = requestAuth || "";
    if (!auth) {
      const cookieCredentials = await getCredentialsFromCookie();
      if (cookieCredentials) {
        auth = cookieCredentials.nextsmsAuth;
      }
    }

    // Validate Auth Token
    if (!auth || !auth.startsWith('Basic ')) {
      return NextResponse.json({ 
        error: 'Invalid or missing authentication token format. Must start with "Basic ".' 
      }, { status: 401 });
    }

    // Process bulk SMS with rate limiting
    const results = await processBulkSMS(messages, auth);
    
    // Calculate success and failure counts
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return NextResponse.json({
      total: results.length,
      successful,
      failed,
      results
    });

  } catch (error: any) {
    console.error("Error in /api/sms/bulk:", error);
    
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ 
        error: "Invalid request body. Ensure it's valid JSON." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 });
  }
}