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
import { Wand2, Loader2, AlertCircle, Info, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAI } from "@/lib/ai-helpers"
import { useCredentials } from "@/lib/credentials-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUserSettings } from "@/lib/settings"
import { getContacts } from "@/lib/contact-service"
import type { Contact } from "@/lib/types"
import { format } from "date-fns"
import { extractPersonalizationVariables } from "@/lib/personalization"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function NewCampaignPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { isConfigured, credentials } = useCredentials() as any
  const ai = useAI()

  const [activeTab, setActiveTab] = useState("details")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [businessSettings, setBusinessSettings] = useState<{
    businessName: string;
    businessType: string;
    products: string;
    description: string;
    slogan?: string;
    emailNotifications?: boolean;
    campaignReports?: boolean;
    lowBalanceAlerts?: boolean;
    aiAutoReply?: boolean;
  } | null>(null)

  // Campaign details state
  const [campaignDetails, setCampaignDetails] = useState({
    name: "",
    sender_id: credentials?.senderId || "N-SMS",
    message: "",
  })

  // Load business settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings()
        if (settings) {
          setBusinessSettings(settings)
          // Update sender_id with business name if available
          if (settings.businessName) {
            setCampaignDetails((prev) => ({
              ...prev,
              sender_id: credentials?.senderId || settings.businessName.substring(0, 11),
            }))
          }
        }
      } catch (error) {
        console.error("Failed to load business settings:", error)
      }
    }

    loadSettings()
  }, [credentials?.senderId])

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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  useEffect(() => {
    if (audienceType === "selected") {
      setLoadingContacts(true)
      getContacts().then((data) => {
        setContacts(data)
        setLoadingContacts(false)
      })
    }
  }, [audienceType])

  // Schedule state
  const [scheduleType, setScheduleType] = useState("now")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("9")

  // Character count and SMS count
  const [charCount, setCharCount] = useState(0)
  const [smsCount, setSmsCount] = useState(0)
  const [personalizationVars, setPersonalizationVars] = useState<string[]>([])

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

    // Extract personalization variables
    const vars = extractPersonalizationVariables(message)
    setPersonalizationVars(vars)
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
        prompt = `Generate a short, engaging SMS marketing campaign message for ${businessSettings.businessName}, a ${businessSettings.businessType} business. The message should reflect our brand voice and mention our products or services. Keep it under 160 characters to fit in a single SMS. Include a clear call to action. You can use personalization variables like {{name}} and {{phone}} in the message.`
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

      // Prepare recipients based on audienceType
      let recipients = [];
      if (audienceType === "all") {
        recipients = contacts;
      } else {
        recipients = contacts.filter(c => selectedContacts.includes(c.id));
      }
      await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaignDetails,
          status: "draft",
          scheduled_date: null,
          recipients,
        })
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

      // Prepare recipients based on audienceType
      let recipients = [];
      if (audienceType === "all") {
        recipients = contacts;
      } else {
        recipients = contacts.filter(c => selectedContacts.includes(c.id));
      }
      await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaignDetails,
          status: scheduleType === "now" ? "active" : "scheduled",
          scheduled_date: scheduleType === "scheduled" ? `${scheduleDate}T${scheduleTime}:00:00Z` : null,
          recipients,
        })
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
          <Card className="max-h-[90vh] overflow-y-auto mx-auto my-8 w-full max-w-lg p-4">
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
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">This sender ID is configured in your <Link href='/settings' className='underline'>settings</Link>.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message</Label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Personalization
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => {
                          const textarea = document.getElementById('message') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '{{name}}' + text.substring(end);
                          setCampaignDetails({ ...campaignDetails, message: newText });
                          updateMessageStats(newText);
                          setTimeout(() => { textarea.focus(); textarea.selectionEnd = start + 7; }, 0);
                        }}>
                          {{name}} - Contact Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const textarea = document.getElementById('message') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '{{phone}}' + text.substring(end);
                          setCampaignDetails({ ...campaignDetails, message: newText });
                          updateMessageStats(newText);
                          setTimeout(() => { textarea.focus(); textarea.selectionEnd = start + 8; }, 0);
                        }}>
                          {{phone}} - Phone Number
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateMessage} disabled={isGenerating || !aiEnabled}>
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

                {personalizationVars.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Personalization Variables</AlertTitle>
                    <AlertDescription>
                      Your message contains the following personalization variables:
                      {personalizationVars.map((v) => (
                        <code key={v} className="mx-1 rounded bg-gray-100 px-1 py-0.5">
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                {aiError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{aiError}</AlertDescription>
                  </Alert>
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
          <Card className="max-h-[90vh] overflow-y-auto mx-auto my-8 w-full max-w-lg p-4">
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
                    <SelectItem value="selected">Selected Contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {audienceType === "selected" && (
                <div className="space-y-2">
                  <Label>Select Contacts</Label>
                  {loadingContacts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                      {contacts.length === 0 ? (
                        <div className="text-center text-gray-500">No contacts available</div>
                      ) : (
                        <div className="space-y-2">
                          {contacts.map((c) => (
                            <div key={c.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`contact-${c.id}`}
                                checked={selectedContacts.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedContacts([...selectedContacts, c.id])
                                  } else {
                                    setSelectedContacts(selectedContacts.filter((id) => id !== c.id))
                                  }
                                }}
                              />
                              <label htmlFor={`contact-${c.id}`} className="cursor-pointer">
                                {c.name} ({c.phone})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-md bg-gray-50 p-4">
                <div className="font-medium">Audience Summary</div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Total recipients: {audienceType === "all" ? contacts.length : selectedContacts.length}</p>
                  <p>Estimated cost: {smsCount * (audienceType === "all" ? contacts.length : selectedContacts.length)} SMS</p>
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
          <Card className="max-h-[90vh] overflow-y-auto mx-auto my-8 w-full max-w-lg p-4">
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
                    Launch Campaign
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
