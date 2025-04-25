"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useCredentials } from "@/lib/credentials-context" 
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useAI } from "@/lib/ai-helpers"
import { useNextsmsApi } from "@/lib/nextsms-api"
import { createMessage } from "@/lib/message-service"
import { getContact } from "@/lib/contact-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUserSettings } from "@/lib/settings-service"

export default function NewMessagePage() {
  const { isConfigured } = useCredentials()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const contactId = searchParams.get("contact")

  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [smsCount, setSmsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [businessSettings, setBusinessSettings] = useState<any>(null)

  const ai = useAI()
  const nextsmsApi = useNextsmsApi()

  // Load business settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings()
        setBusinessSettings(settings)
      } catch (error) {
        console.error("Failed to load business settings:", error)
      }
    }

    loadSettings()
  }, [])

  // Load contact if contactId is provided
  useEffect(() => {
    const loadContact = async () => {
      if (contactId) {
        try {
          setIsLoading(true)
          const contact = await getContact(contactId)
          if (contact) {
            setRecipient(contact.phone)
          }
        } catch (error) {
          console.error("Failed to load contact:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadContact()
  }, [contactId])

  // Update character count and SMS count
  useEffect(() => {
    setCharCount(message.length)

    // Calculate SMS count (rough estimate)
    if (message.length === 0) {
      setSmsCount(0)
    } else if (message.length <= 160) {
      setSmsCount(1)
    } else {
      setSmsCount(Math.ceil(message.length / 153))
    }
  }, [message])

  // Generate message with AI
  const handleGenerateMessage = async () => {
    // Clear previous errors
    setAiError(null)

    if (!ai.isConfigured) {
      setAiError("OpenRouter API key not configured. Please configure it in the settings page.")
      toast({
        title: "API credentials not configured",
        description: "Please configure your OpenRouter API key in the settings page.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      // Create a prompt that incorporates business context
      let prompt = "Generate a short, engaging SMS marketing message for my business."

      // Add more context if we have business settings
      if (businessSettings) {
        prompt = `Generate a short, engaging SMS marketing message for ${businessSettings.businessName}, a ${businessSettings.businessType} business. 
        The message should reflect our brand voice and mention our products or services. 
        Keep it under 160 characters to fit in a single SMS.`
      }

      const generatedText = await ai.generateContent({ prompt })
      setMessage(generatedText)
    } catch (error: any) {
      console.error("Failed to generate message:", error)
      setAiError(error.message || "Failed to generate message")
      toast({
        title: "Failed to generate message",
        description: error.message || "An error occurred while generating the message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConfigured) {
      toast({
        title: "API credentials not configured",
        description: "Please configure your NextSMS credentials in the settings page.",
        variant: "destructive",
      })
      return
    }

    if (!recipient) {
      toast({
        title: "Recipient required",
        description: "Please enter a recipient phone number.",
        variant: "destructive",
      })
      return
    }

    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to send.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)

      // Send SMS via NextSMS API
      await nextsmsApi.sendSMS({
        from: businessSettings?.businessName?.substring(0, 11) || "N-SMS",
        to: recipient,
        text: message,
      })

      // Create message record
      await createMessage({
        contact_id: contactId || null,
        campaign_id: null,
        message,
        status: "sent",
        sent_at: new Date().toISOString(),
      })

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      })

      // Redirect to messages page
      router.push("/messages")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Failed to send message",
        description: "An error occurred while sending the message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Check if AI is configured
  const aiEnabled = ai.isConfigured

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Send New Message</h1>
      </div>

      <Card>
        <form onSubmit={handleSendMessage}>
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
            <CardDescription>Compose and send an SMS message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Phone Number *</Label>
              <Input
                id="recipient"
                placeholder="255712345678"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <p className="text-xs text-gray-500">Enter the phone number with country code (e.g., 255712345678)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Message *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateMessage}
                  disabled={isGenerating || !aiEnabled}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="message"
                placeholder="Enter your message here or generate with AI"
                className="min-h-[120px]"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">Character count: {charCount}</p>
                <p className="text-xs text-gray-500">SMS count: {smsCount}</p>
              </div>

              {aiError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{aiError}</AlertDescription>
                </Alert>
              )}

              {!isConfigured && (
                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                  <p>
                    API credentials not configured. Please configure your NextSMS credentials in the{" "}
                    <Link href="/settings" className="font-medium underline">
                      settings
                    </Link>{" "}
                    page.
                  </p>
                </div>
              )}

              {!aiEnabled && isConfigured && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p>
                    AI message generation requires OpenRouter API credentials. Please configure them in the{" "}
                    <Link href="/settings" className="font-medium underline">
                      settings
                    </Link>{" "}
                    page.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/messages">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSending || !isConfigured}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
