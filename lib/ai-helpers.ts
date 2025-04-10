"use client"

import { useCredentials } from "./credentials-context"
import { getUserSettings } from "./settings-service"

type GenerateAIContentProps = {
  prompt: string
  systemPrompt?: string
  apiKey?: string
  businessContext?: boolean
}

export async function generateAIContent({
  prompt,
  systemPrompt = "You are a helpful marketing assistant that creates engaging SMS marketing messages that are concise and compelling. Keep messages under 160 characters when possible.",
  apiKey,
  businessContext = true,
}: GenerateAIContentProps): Promise<string> {
  try {
    // Get business settings if businessContext is true
    let businessInfo = {}
    if (businessContext) {
      try {
        const settings = await getUserSettings()
        businessInfo = {
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

    // Make request to our API route
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        apiKey,
        businessInfo,
        model: "google/gemini-2.5-pro-exp-03-25:free", // Specify the model
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate content")
    }

    const data = await response.json()
    return data.text
  } catch (error) {
    console.error("Error generating AI content:", error)
    throw error
  }
}

// Hook for using AI content generation with credentials context
export function useAI() {
  const { isConfigured, credentials } = useCredentials()

  const generateContent = async ({
    prompt,
    systemPrompt,
    businessContext = true,
  }: Omit<GenerateAIContentProps, "apiKey">): Promise<string> => {
    if (!isConfigured || !credentials.openrouterApiKey) {
      throw new Error("OpenRouter API key not configured")
    }

    return generateAIContent({
      prompt,
      systemPrompt,
      apiKey: credentials.openrouterApiKey,
      businessContext,
    })
  }

  return {
    generateContent,
    isConfigured: isConfigured && !!credentials.openrouterApiKey,
  }
}
