"use client"

import { useState, useEffect, useCallback } from "react"

import { useCredentials } from "./credentials-context"

export function useNextsmsApi() {
  const { credentials, isConfigured } = useCredentials()
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    setIsAvailable(isConfigured && !!credentials.nextsmsAuth)
  }, [isConfigured, credentials.nextsmsAuth])

  // Update the getSMSBalance method to handle errors better
  const getSMSBalance = useCallback(async () => {
    if (!isAvailable) {
      throw new Error("NextSMS API not configured")
    }

    try {
      console.log("Fetching SMS balance...")
      const response = await fetch("/api/sms/balance", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      console.log("Balance API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText || "Unknown error" }
        }

        console.error("Balance API error response:", response.status, errorData)

        // Handle both 401 and 403 as authentication errors based on logs
        if (response.status === 401 || response.status === 403) {
           // Check for specific NextSMS message if available
           const authErrorMessage = errorData?.message === 'Not Authorized'
             ? 'Authentication failed (Not Authorized). Please check your API credentials.'
             : 'Authentication failed. Please check your API credentials in the settings page.';
          throw new Error(authErrorMessage);
        }
         // Handle 429 Too Many Requests
        if (response.status === 429) {
          throw new Error("Too many requests to NextSMS API. Please wait a moment and try again.");
        }

        // General error
        throw new Error(errorData?.error || errorData?.message || errorData?.details || `Failed to get SMS balance (Status: ${response.status})`)
      }

      const data = await response.json()
      console.log("Balance API response data:", data)
      return data
    } catch (error: any) {
      console.error("Failed to get SMS balance:", error)
      throw error
    }
  }, [isAvailable])

  const sendSMS = useCallback(
    async (payload: { from: string; to: string; text: string }) => {
      if (!isAvailable) {
        throw new Error("NextSMS API not configured")
      }

      try {
        // Ensure the phone number is properly formatted
        let to = payload.to.trim().replace(/\s+/g, "")
        if (!to.startsWith("+") && to.length < 12) {
          if (!to.startsWith("255")) {
            if (to.startsWith("0")) {
              to = "255" + to.substring(1)
            } else {
              to = "255" + to
            }
          }
        }

        // Ensure sender ID is valid (alphanumeric and max 11 characters)
        const from = payload.from.substring(0, 11).replace(/[^a-zA-Z0-9]/g, "")

        const formattedPayload = {
          ...payload,
          from,
          to,
        }

        console.log("Sending SMS with payload:", formattedPayload)

        const response = await fetch("/api/sms/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ payload: formattedPayload, auth: credentials.nextsmsAuth }),
        })

        console.log("SMS API response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            errorData = { error: errorText || "Unknown error" }
          }

          console.error("SMS API error response:", response.status, errorData)

         // Handle both 401 and 403 as authentication errors
         if (response.status === 401 || response.status === 403) {
            const authErrorMessage = errorData?.message === 'Not Authorized'
              ? 'Authentication failed (Not Authorized). Please check your API credentials.'
              : 'Authentication failed. Please check your API credentials in the settings page.';
           throw new Error(authErrorMessage);
         }
          // Handle 429 Too Many Requests
         if (response.status === 429) {
           throw new Error("Too many requests to NextSMS API. Please wait a moment and try again.");
         }

          // General error
          throw new Error(errorData?.error || errorData?.message || errorData?.details?.message || `Failed to send SMS (Status: ${response.status})`)
        }

        const data = await response.json()
        return data
      } catch (error: any) {
        console.error("Failed to send SMS:", error)
        throw error
      }
    },
    [isAvailable, credentials.nextsmsAuth],
  )

  // Send multiple SMS messages in bulk with rate limiting
  const sendBulkSMS = useCallback(
    async (messages: Array<{ from: string; to: string; text: string }>) => {
      if (!isAvailable) {
        throw new Error("NextSMS API not configured")
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("Invalid messages array. Must provide at least one message.")
      }

      try {
        console.log(`Sending bulk SMS with ${messages.length} messages`)

        const response = await fetch("/api/sms/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ 
            messages, 
            auth: credentials.nextsmsAuth 
          }),
        })

        console.log("Bulk SMS API response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            errorData = { error: errorText || "Unknown error" }
          }

          console.error("Bulk SMS API error response:", response.status, errorData)

          // Handle both 401 and 403 as authentication errors
          if (response.status === 401 || response.status === 403) {
            const authErrorMessage = errorData?.message === 'Not Authorized'
              ? 'Authentication failed (Not Authorized). Please check your API credentials.'
              : 'Authentication failed. Please check your API credentials in the settings page.';
            throw new Error(authErrorMessage);
          }
          
          // Handle 429 Too Many Requests
          if (response.status === 429) {
            throw new Error("Too many requests to NextSMS API. Please wait a moment and try again.");
          }

          // General error
          throw new Error(errorData?.error || errorData?.message || errorData?.details?.message || `Failed to send bulk SMS (Status: ${response.status})`)
        }

        const data = await response.json()
        return data
      } catch (error: any) {
        console.error("Failed to send bulk SMS:", error)
        throw error
      }
    },
    [isAvailable, credentials.nextsmsAuth],
  )

  return {
    isConfigured: isAvailable,
    getSMSBalance,
    sendSMS,
    sendBulkSMS
  }
}

// Server-side function to send SMS
export async function sendSMSServer(options: { from: string; to: string; text: string; auth: string }) {
  try {
    const { from, to, text, auth } = options;

    // Validate auth format
    if (!auth.startsWith('Basic ')) {
      throw new Error('Invalid authentication format');
    }

    // Format phone number to E.164
    let formattedPhone = to.trim().replace(/[^0-9]/g, '');
    if (!formattedPhone.startsWith('255')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '255' + formattedPhone.substring(1);
      } else {
        formattedPhone = '255' + formattedPhone;
      }
    }

    // Validate sender ID
    const validSenderId = from.substring(0, 11).replace(/[^a-zA-Z0-9]/g, '');

    const response = await fetch('https://messaging-service.co.tz/api/sms/v1/text/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify({
        from: validSenderId,
        to: formattedPhone,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || "Unknown error" };
      }

      // Handle specific error cases from the documentation
      switch(errorData.error) {
        case 'REJECTED_NOT_ENOUGH_CREDITS':
          throw new Error('Not enough SMS credits. Please top up your account.');
        case 'REJECTED_SENDER':
          throw new Error('Sender ID has been blacklisted. Please use a different sender ID.');
        case 'REJECTED_DESTINATION':
          throw new Error('Destination number is blacklisted.');
        case 'REJECTED_INVALID_DESTINATION':
          throw new Error('Invalid phone number format.');
        default:
          if (response.status === 401) {
            throw new Error('Authentication failed. Please check your API credentials.');
          }
          throw new Error(errorData.error || errorData.details || 'Failed to send SMS');
      }
    }

    return await response.json();
  } catch (error: any) {
    console.error('SMS sending error:', error);
    throw error;
  }
}

// Server-side API function for sending SMS
export async function sendSMS(req: Request) {
  try {
    // Get auth from environment variable first (most secure)
    const auth = process.env.NEXTSMS_AUTH || ""

    if (!auth) {
      return new Response(JSON.stringify({ error: "Nextsms credentials not configured" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Make sure auth is properly formatted with "Basic " prefix if not already present
    const authHeader = auth.startsWith("Basic ") ? auth : `Basic ${auth}`

    const { from, to, text } = await req.json()

    // Set default sender ID if not provided
    const payload = {
      from: from || "BBASPA",
      to: to,
      text: text,
    }

    // Actual API call to NextSMS
    try {
      const endpoint = "https://messaging-service.co.tz/api/sms/v1/text/single"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      })

      console.log("NextSMS API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText || "Unknown error" }
        }

        console.error("NextSMS API error:", errorData)
        return new Response(
          JSON.stringify({
            error: "Failed to send SMS via NextSMS API",
            details: errorData,
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      const data = await response.json()
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error: any) {
      console.error("Error calling NextSMS API:", error)
      return new Response(
        JSON.stringify({
          error: "Failed to send SMS",
          details: error.message || "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    console.error("Error in SMS send route:", error.message || error)
    return new Response(
      JSON.stringify({
        error: "Failed to send SMS",
        details: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
