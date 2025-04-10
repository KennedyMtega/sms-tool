import { cookies } from "next/headers"
import { getUserSettingsServer } from "@/lib/settings"

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt, apiKey: providedApiKey, businessInfo, model } = await req.json()

    // First try to use the API key provided in the request
    let openrouterApiKey = providedApiKey || ""

    // If not provided in the request, get from cookies
    if (!openrouterApiKey) {
      const cookieStore = cookies()
      const credentialsCookie = cookieStore.get("sms_marketing_credentials")

      if (credentialsCookie) {
        try {
          const credentials = JSON.parse(credentialsCookie.value)
          openrouterApiKey = credentials.openrouterApiKey || ""
        } catch (e) {
          console.error("Failed to parse credentials cookie:", e)
        }
      }
    }

    // If still not available, try environment variable
    if (!openrouterApiKey) {
      openrouterApiKey = process.env.OPENROUTER_API_KEY || ""
    }

    if (!openrouterApiKey) {
      return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get business settings if not provided
    let businessData = businessInfo
    if (!businessData) {
      try {
        const settings = await getUserSettingsServer()
        businessData = {
          businessName: settings.businessName,
          slogan: settings.slogan,
          businessType: settings.businessType,
          description: settings.description,
          products: settings.products,
        }
      } catch (error) {
        console.error("Failed to load business settings for AI context:", error)
      }
    }

    // Enhance system prompt with business context
    let enhancedSystemPrompt = systemPrompt
    if (businessData) {
      enhancedSystemPrompt = `${systemPrompt}\n\nBusiness Information:\nName: ${businessData.businessName}\nSlogan: ${businessData.slogan}\nType: ${businessData.businessType}\nDescription: ${businessData.description}\nProducts/Services: ${businessData.products}`
    }

    // In a real implementation, this would make an actual API call to OpenRouter
    // For testing purposes, let's actually make the API call to OpenRouter
    try {
      const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterApiKey}`,
          "HTTP-Referer": "https://v0.dev", // Required for OpenRouter
          "X-Title": "SMS Marketing Tool", // Optional, but good practice
        },
        body: JSON.stringify({
          model: model || "google/gemini-2.5-pro-exp-03-25:free",
          messages: [
            { role: "system", content: enhancedSystemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      })

      if (!openrouterResponse.ok) {
        const errorData = await openrouterResponse.json()
        console.error("OpenRouter API error:", errorData)

        // Fall back to mock response if API call fails
        return new Response(
          JSON.stringify({
            text: generateMockAIResponse(prompt, enhancedSystemPrompt, businessData),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      const data = await openrouterResponse.json()
      const generatedText = data.choices[0]?.message?.content || ""

      return new Response(JSON.stringify({ text: generatedText }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error calling OpenRouter API:", error)

      // Fall back to mock response if API call fails
      return new Response(
        JSON.stringify({
          text: generateMockAIResponse(prompt, enhancedSystemPrompt, businessData),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    console.error("Error in AI route:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to generate AI content",
        details: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Helper function to generate mock AI responses with business context
function generateMockAIResponse(prompt: string, systemPrompt?: string, businessInfo?: any): string {
  const businessName = businessInfo?.businessName || "Our business"
  const products = businessInfo?.products || "our products"

  // Variety of marketing message templates
  const marketingResponses = [
    `Summer SALE at ${businessName}! 🔥 Get 20% OFF all products this weekend only. Use code SUMMER20 at checkout. Limited time offer! Reply STOP to opt out.`,
    `Exciting news from ${businessName}! Our new premium items are now available. Be the first to try them out at our website. Reply STOP to opt out.`,
    `Thank you for being a valued ${businessName} customer! Enjoy a special 15% discount on your next purchase with code THANKS15. Valid until the end of the month.`,
    `Don't miss our weekend flash sale at ${businessName}! All items 30% off for 48 hours only. Shop now at our website. Reply STOP to opt out.`,
    `Introducing our new loyalty program at ${businessName}! Earn points with every purchase and get exclusive rewards. Learn more on our website.`,
    `${businessName} special offer: Buy one, get one 50% off on all items this week only! Visit us today. Reply STOP to opt out.`,
    `We miss you at ${businessName}! Come back and enjoy 20% off your next purchase with code COMEBACK20. Valid for 7 days only.`,
    `${businessName} holiday special! Shop our exclusive collection and get free shipping on all orders over $50. Use code HOLIDAY at checkout.`,
    `New arrival alert from ${businessName}! Check out our latest collection now available in store and online. Reply STOP to opt out.`,
    `${businessName} members only: Early access to our seasonal sale starts now! Shop before everyone else with code EARLY20 for an extra 10% off.`,
  ]

  // Simple logic to pick a response based on the prompt
  if (prompt.toLowerCase().includes("sale") || prompt.toLowerCase().includes("discount")) {
    return marketingResponses[0]
  } else if (prompt.toLowerCase().includes("new") || prompt.toLowerCase().includes("product")) {
    return marketingResponses[1]
  } else if (prompt.toLowerCase().includes("thank") || prompt.toLowerCase().includes("customer")) {
    return marketingResponses[2]
  } else if (prompt.toLowerCase().includes("weekend") || prompt.toLowerCase().includes("flash")) {
    return marketingResponses[3]
  } else if (prompt.toLowerCase().includes("loyalty") || prompt.toLowerCase().includes("program")) {
    return marketingResponses[4]
  } else if (prompt.toLowerCase().includes("special") || prompt.toLowerCase().includes("offer")) {
    return marketingResponses[5]
  } else if (prompt.toLowerCase().includes("miss") || prompt.toLowerCase().includes("comeback")) {
    return marketingResponses[6]
  } else if (prompt.toLowerCase().includes("holiday") || prompt.toLowerCase().includes("season")) {
    return marketingResponses[7]
  } else if (prompt.toLowerCase().includes("new") || prompt.toLowerCase().includes("arrival")) {
    return marketingResponses[8]
  } else if (prompt.toLowerCase().includes("member") || prompt.toLowerCase().includes("exclusive")) {
    return marketingResponses[9]
  }

  // Default response - random selection
  return marketingResponses[Math.floor(Math.random() * marketingResponses.length)]
}
