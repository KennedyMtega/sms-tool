"use client"

import Link from "next/link"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wand2, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createCampaign } from "@/lib/campaign-service"
import { useAI } from "@/lib/ai-helpers"
import { useCredentials } from "@/lib/credentials-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUserSettings } from "@/lib/settings-service"

export default function NewCampaignPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { isConfigured, credentials } = useCredentials()
  const ai = useAI()

  const [activeTab, setActiveTab] = useState("details")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [businessSettings, setBusinessSettings] = useState<any>(null)

  // Campaign details state
  const [campaignDetails, setCampaignDetails] = useState({
    name: "",
    sender_id: credentials.senderId || "N-SMS",
    message: "",
  })

  // Load business settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings()
        setBusinessSettings(settings)

        // Update sender_id with business name if available
        if (settings.businessName) {
          setCampaignDetails((prev) => ({
            ...prev,
            sender_id: credentials.senderId || settings.businessName.substring(0, 11),
          }))
        }
      } catch (error) {
        console.error("Failed to load business settings:", error)
      }
    }

    loadSettings()
  }, [])

  // Update sender_id when credentials change
  useEffect(() => {
    if (credentials.senderId) {
      setCampaignDetails((prev) => ({
        ...prev,
        sender_id: credentials.senderId,
      }))
    }
  }, [credentials.senderId])

  // Audience state
  const [audienceType, setAudienceType] = useState("all")

  // Schedule state
  const [scheduleType, setScheduleType] = useState("now")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("9")

  // Character count and SMS count
  const [charCount, setCharCount] = useState(0)
  const [smsCount, setSmsCount] = useState(0)

  // Update character count and SMS count
  const updateMessageStats = (message: string) => {
    const length = message.length
    setCharCount(length)

    // Calculate SMS count (rough estimate)
    if (length === 0) {
      setSmsCount(0)
    } else if (length <= 160) {
      setSmsCount(1)
    } else {
      setSmsCount(Math.ceil(length / 153))
    }
  }

  // Handle message change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const message = e.target.value
    setCampaignDetails({ ...campaignDetails, message })
    updateMessageStats(message)
  }

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
        prompt = `Generate a short, engaging SMS marketing campaign message for ${businessSettings.businessName}, a ${businessSettings.businessType} business. 
        The message should reflect our brand voice and mention our products or services. 
        Keep it under 160 characters to fit in a single SMS.
        Include a clear call to action.`
      }

      const generatedText = await ai.generateContent({ prompt })
      setCampaignDetails({ ...campaignDetails, message: generatedText })
      updateMessageStats(generatedText)
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

  // Save campaign as draft
  const handleSaveAsDraft = async () => {
    if (!campaignDetails.name) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for the campaign.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      // Create campaign
      await createCampaign({
        ...campaignDetails,
        status: "draft",
        scheduled_date: null,
        sent_count: 0,
        delivered_count: 0,
        response_count: 0,
      })

      toast({
        title: "Campaign saved",
        description: "The campaign has been saved as a draft.",
      })

      // Redirect to campaigns page
      router.push("/campaigns")
    } catch (error) {
      console.error("Failed to save campaign:", error)
      toast({
        title: "Failed to save campaign",
        description: "An error occurred while saving the campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Launch campaign
  const handleLaunchCampaign = async () => {
    if (!campaignDetails.name) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for the campaign.",
        variant: "destructive",
      })
      return
    }

    if (!campaignDetails.message) {
      toast({
        title: "Message required",
        description: "Please enter a message for the campaign.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      // Create campaign
      await createCampaign({
        ...campaignDetails,
        status: scheduleType === "now" ? "active" : "scheduled",
        scheduled_date: scheduleType === "scheduled" ? `${scheduleDate}T${scheduleTime}:00:00Z` : null,
        sent_count: 0,
        delivered_count: 0,
        response_count: 0,
      })

      toast({
        title: "Campaign launched",
        description:
          scheduleType === "now"
            ? "The campaign has been launched and messages will be sent shortly."
            : "The campaign has been scheduled and will be sent at the specified time.",
      })

      // Redirect to campaigns page
      router.push("/campaigns")
    } catch (error) {
      console.error("Failed to launch campaign:", error)
      toast({
        title: "Failed to launch campaign",
        description: "An error occurred while launching the campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Navigate to next tab
  const goToNextTab = () => {
    if (activeTab === "details") {
      setActiveTab("audience")
    } else if (activeTab === "audience") {
      setActiveTab("schedule")
    }
  }

  // Navigate to previous tab
  const goToPreviousTab = () => {
    if (activeTab === "audience") {
      setActiveTab("details")
    } else if (activeTab === "schedule") {
      setActiveTab("audience")
    }
  }

  // Check if AI is configured
  const aiEnabled = ai.isConfigured
  console.log("AI status:", { aiEnabled, isConfigured, openrouterApiKey: credentials.openrouterApiKey })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="audience">Target Audience</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>Enter the basic details for your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Summer Sale Announcement"
                  value={campaignDetails.name}
                  onChange={(e) => setCampaignDetails({ ...campaignDetails, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender_id">Sender ID</Label>
                <Input
                  id="sender_id"
                  placeholder="N-SMS"
                  value={campaignDetails.sender_id}
                  onChange={(e) => setCampaignDetails({ ...campaignDetails, sender_id: e.target.value })}
                />
                <p className="text-xs text-gray-500">This is the name that will appear as the sender of your SMS</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message</Label>
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
                  value={campaignDetails.message}
                  onChange={handleMessageChange}
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

                {!aiEnabled && (
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
              <Button variant="outline" onClick={handleSaveAsDraft} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
              <Button onClick={goToNextTab}>Continue to Audience</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>Select who will receive this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Audience Type</Label>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="tags">Specific Tags</SelectItem>
                    <SelectItem value="custom">Custom List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <div className="font-medium">Audience Summary</div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Total recipients: Calculating...</p>
                  <p>Estimated cost: Calculating...</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousTab}>
                Back
              </Button>
              <Button onClick={goToNextTab}>Continue to Schedule</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Campaign</CardTitle>
              <CardDescription>Choose when to send your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Option</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Immediately</SelectItem>
                    <SelectItem value="scheduled">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === "scheduled" && (
                <>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select value={scheduleTime} onValueChange={setScheduleTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9">09:00 AM</SelectItem>
                        <SelectItem value="12">12:00 PM</SelectItem>
                        <SelectItem value="15">03:00 PM</SelectItem>
                        <SelectItem value="18">06:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousTab}>
                Back
              </Button>
              <Button onClick={handleLaunchCampaign} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  "Launch Campaign"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
