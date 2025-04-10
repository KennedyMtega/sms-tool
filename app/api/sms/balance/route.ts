import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

export async function GET() {
  try {
    // 1. Get Auth Token from cookie
    const cookieCredentials = await getCredentialsFromCookie(); // Await helper
    const auth = cookieCredentials?.nextsmsAuth || "";

    // 2. Validate Auth Token
    if (!auth || !auth.startsWith('Basic ')) {
      return NextResponse.json({ error: 'Invalid or missing authentication token format. Must start with "Basic ".' }, { status: 401 });
    }

    // 3. Call NextSMS API (with specific network error handling)
    let response;
    try {
       response = await fetch('https://messaging-service.co.tz/api/sms/v1/balance', {
        method: 'GET', // Explicitly set method
        headers: {
          'Accept': 'application/json',
          'Authorization': auth // Use the validated auth token
        },
        cache: 'no-store', // Ensure fresh data
      });
    } catch (networkError: any) {
       console.error("Network error fetching NextSMS balance:", networkError);
       return NextResponse.json({ error: 'Network error connecting to NextSMS API.', details: networkError.message }, { status: 503 }); // Service Unavailable
    }


    // 4. Handle Response and Errors
    if (!response.ok) {
      let errorData;
      const errorText = await response.text();
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || "Unknown NextSMS API error" };
      }

      console.error("NextSMS Balance API Error:", response.status, errorData);

      let errorMessage = 'Failed to fetch SMS balance';
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please check your API credentials.';
      } else {
        errorMessage = errorData.error || errorData.message || `NextSMS API Error (${response.status})`;
      }
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: response.status });
    }

    const responseData = await response.json();
    // The API returns balance in a specific structure, let's ensure we return it correctly
    // Assuming the API returns { "sms_balance": 123 }
    return NextResponse.json({ sms_balance: responseData.sms_balance });

  } catch (error: any) {
    console.error("Error in /api/sms/balance:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
