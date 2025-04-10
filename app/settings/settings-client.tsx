"use client"

import { useState, useEffect, ChangeEvent, SyntheticEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCredentials } from "@/lib/credentials-context"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Info, AlertCircle } from "lucide-react"
import { getUserSettings, updateUserSettings } from "@/lib/settings-service"
import { useNextsmsApi } from "@/lib/nextsms-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Helper function to generate Basic Auth token
function generateBasicAuth(username: string, password: string): string {
  try {
    // Use Buffer only if in Node.js-like environment, otherwise use btoa for browser
    if (typeof Buffer !== 'undefined') {
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      return `Basic ${token}`;
    } else if (typeof btoa !== 'undefined') {
      const token = btoa(`${username}:${password}`);
      return `Basic ${token}`;
    } else {
      throw new Error("Cannot perform Base64 encoding in this environment.");
    }
  } catch (error) {
    console.error("Base64 encoding failed:", error);
    // Return an invalid format to signal the error upstream if needed
    return "invalid_base64";
  }
}


export default function SettingsClient() {
  const { credentials, updateCredentials, isLoading: credentialsLoading } = useCredentials()
  const { toast } = useToast()
  const nextsmsApi = useNextsmsApi()

  // Business settings state
  const [businessSettings, setBusinessSettings] = useState({
    businessName: "Acme Inc.",
    slogan: "Quality products for everyone",
    businessType: "retail",
    description: "Acme Inc. is a leading provider of high-quality products for both consumers and businesses.",
    products: "- Premium Widget: $99.99\n- Basic Widget: $49.99",
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignReports: true,
    lowBalanceAlerts: true,
    aiAutoReply: true,
  })

  // API credentials state - Add username and password
  const [apiCredentials, setApiCredentials] = useState({
    nextsmsUsername: credentials.nextsmsUsername || "",
    nextsmsPassword: credentials.nextsmsPassword || "",
    nextsmsAuth: credentials.nextsmsAuth || "",
    openrouterApiKey: credentials.openrouterApiKey || "",
    senderId: credentials.senderId || "BBASPA",
  })

  // Test SMS state
  const [testPhoneNumber, setTestPhoneNumber] = useState("255764738005")
  const [testMessage, setTestMessage] = useState("")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState<boolean>(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [smsBalance, setSmsBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const settings = await getUserSettings()

        setBusinessSettings({
          businessName: settings.businessName || "Acme Inc.",
          slogan: settings.slogan || "Quality products for everyone",
          businessType: settings.businessType || "retail",
          description:
            settings.description ||
            "Acme Inc. is a leading provider of high-quality products for both consumers and businesses.",
          products: settings.products || "- Premium Widget: $99.99\n- Basic Widget: $49.99",
        })

        setNotificationSettings({
          emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : true,
          campaignReports: settings.campaignReports !== undefined ? settings.campaignReports : true,
          lowBalanceAlerts: settings.lowBalanceAlerts !== undefined ? settings.lowBalanceAlerts : true,
          aiAutoReply: settings.aiAutoReply !== undefined ? settings.aiAutoReply : true,
        })

        // Set default test message
        setTestMessage(
          `This is a test message from ${settings.businessName}. Thank you for using our SMS marketing tool!`,
        )
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast({
          title: "Error loading settings",
          description: "Your settings could not be loaded. Using default values.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  // Update credentials state when context changes
  useEffect(() => {
    if (!credentialsLoading) {
      // Initialize with potentially existing values from context
      setApiCredentials({
        nextsmsUsername: credentials.nextsmsUsername || "",
        nextsmsPassword: credentials.nextsmsPassword || "",
        nextsmsAuth: credentials.nextsmsAuth || "",
        openrouterApiKey: credentials.openrouterApiKey || "",
        senderId: credentials.senderId || "BBASPA",
      })
    }
  }, [credentials, credentialsLoading])

  // Fetch SMS balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (nextsmsApi.isConfigured) {
        try {
          setLoadingBalance(true)
          setSmsBalance(null) // Reset balance while loading
          setBalanceError(null) // Clear any previous errors

          console.log("Fetching SMS balance...")
          const balance = await nextsmsApi.getSMSBalance()
          console.log("SMS balance fetched:", balance)
          setSmsBalance(balance.sms_balance)
        } catch (error: any) {
          console.error("Failed to fetch SMS balance:", error)
          setBalanceError(error.message || "Failed to fetch SMS balance")
          // Show toast with error message
          toast({
            title: "Failed to fetch SMS balance",
            description: error.message || "Please check your API credentials",
            variant: "destructive",
          })
        } finally {
          setLoadingBalance(false)
        }
      }
    }

    if (nextsmsApi.isConfigured && !credentialsLoading) {
      fetchBalance()
    }
  }, [nextsmsApi, credentialsLoading, toast])

  // Manual balance refresh
  const handleRefreshBalance = async () => {
    if (!nextsmsApi.isConfigured) {
      toast({
        title: "API credentials not configured",
        description: "Please save your NextSMS credentials before checking balance.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingBalance(true)
      setSmsBalance(null) // Reset balance while loading
      setBalanceError(null) // Clear any previous errors

      const balance = await nextsmsApi.getSMSBalance()
      setSmsBalance(balance.sms_balance)

      toast({
        title: "Balance refreshed",
        description: `Your current SMS balance is ${balance.sms_balance}`,
      })
    } catch (error: any) {
      console.error("Failed to refresh SMS balance:", error)
      setBalanceError(error.message || "Failed to fetch SMS balance")
      toast({
        title: "Failed to refresh SMS balance",
        description: error.message || "Please check your API credentials",
        variant: "destructive",
      })
    } finally {
      setLoadingBalance(false)
    }
  }

  // Update API credentials
  const handleSaveCredentials = async () => {
    try {
      setIsSaving(true)
      let finalAuthToken = "";
      let credsToSave: Partial<typeof apiCredentials> = { ...apiCredentials };

      // Prioritize username/password if provided
      if (apiCredentials.nextsmsUsername && apiCredentials.nextsmsPassword) {
        finalAuthToken = generateBasicAuth(apiCredentials.nextsmsUsername, apiCredentials.nextsmsPassword);
        if (finalAuthToken === "invalid_base64") {
           toast({
            title: "Encoding Error",
            description: "Could not generate authentication token from username/password.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        // Clear the direct auth token input if we generated from user/pass
        credsToSave.nextsmsAuth = finalAuthToken;
        // Optionally clear password field after generating token for security
        // setApiCredentials(prev => ({ ...prev, nextsmsPassword: "" }));
      } else if (apiCredentials.nextsmsAuth) {
        // Use the direct token input if username/password are empty
        finalAuthToken = apiCredentials.nextsmsAuth.trim();
        if (finalAuthToken && !finalAuthToken.startsWith("Basic ")) {
          finalAuthToken = `Basic ${finalAuthToken}`;
        }
        // Clear username/password if using direct token
        credsToSave.nextsmsUsername = "";
        credsToSave.nextsmsPassword = "";
        credsToSave.nextsmsAuth = finalAuthToken; // Ensure state reflects the prefixed token
      }

      // Validate the final token format
      if (!finalAuthToken || !finalAuthToken.startsWith("Basic ")) {
        toast({
          title: "Invalid Credentials",
          description: "Please provide either a valid NextSMS Auth Token (starting with 'Basic ') OR a valid Username and Password.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Update context with the final token and potentially cleared user/pass
      await updateCredentials({
        ...credsToSave, // Includes potentially cleared user/pass
        nextsmsAuth: finalAuthToken, // Always pass the final token
      });

      toast({
        title: "Credentials saved",
        description: "Your API credentials have been saved successfully.",
      });

      // Refresh the page to ensure all components use the new credentials
      window.location.reload();
    } catch (error) {
      console.error("Failed to save credentials:", error);
      toast({
        title: "Error saving credentials",
        description: "Your credentials could not be saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update business settings
  const handleSaveBusinessSettings = async () => {
    try {
      setIsSaving(true)
      await updateUserSettings(businessSettings)
      toast({
        title: "Business settings saved",
        description: "Your business settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save business settings:", error)
      toast({
        title: "Error saving settings",
        description: "Your business settings could not be saved. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Update notification settings
  const handleSaveNotificationSettings = async () => {
    try {
      setIsSaving(true)
      await updateUserSettings(notificationSettings)
      toast({
        title: "Notification settings saved",
        description: "Your notification settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save notification settings:", error)
      toast({
        title: "Error saving settings",
        description: "Your notification settings could not be saved. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Send test SMS
  const handleSendTestSMS = async () => {
    if (!nextsmsApi.isConfigured) {
      toast({
        title: "API credentials not configured",
        description: "Please save your NextSMS credentials before sending a test message.",
        variant: "destructive",
      })
      return
    }

    if (!testPhoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to send the test message to.",
        variant: "destructive",
      })
      return
    }

    if (!testMessage) {
      toast({
        title: "Message required",
        description: "Please enter a message to send.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSendingTest(true)
      setTestError(null)
      setTestSuccess(false)

      // Format phone number - ensure it starts with country code and has no spaces or special characters
      let formattedPhone = testPhoneNumber.trim().replace(/\s+/g, "")
      // If it doesn't start with a plus and has fewer than 12 digits, assume it needs the Tanzania country code
      if (!formattedPhone.startsWith("+") && formattedPhone.length < 12) {
        if (!formattedPhone.startsWith("255")) {
          // If it starts with 0, replace it with 255
          if (formattedPhone.startsWith("0")) {
            formattedPhone = "255" + formattedPhone.substring(1)
          } else {
            formattedPhone = "255" + formattedPhone
          }
        }
      }

      // Ensure sender ID is valid (alphanumeric and max 11 characters)
      const senderId = apiCredentials.senderId || "BBASPA"
      const validSenderId = senderId.substring(0, 11).replace(/[^a-zA-Z0-9]/g, "")

      console.log("Sending test SMS to:", formattedPhone, "from:", validSenderId)

      // Send test SMS using the NextSMS API
      const result = await nextsmsApi.sendSMS({
        from: validSenderId,
        to: formattedPhone,
        text: testMessage,
      })

      console.log("Test SMS result:", result)
      setTestSuccess(true)
      toast({
        title: "Test message sent",
        description: "Your test message has been sent successfully.",
      })
    } catch (error: any) {
      console.error("Failed to send test message:", error)
      setTestError(error.message || "Failed to send test message")
      toast({
        title: "Failed to send test message",
        description: error.message || "An error occurred while sending the test message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  if (isLoading || credentialsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API Credentials</TabsTrigger>
          <TabsTrigger value="business">Business Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="test">Test SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Credentials</CardTitle>
              <CardDescription>Configure your NextSMS API credentials for sending messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* Username/Password Inputs */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="nextsmsUsername">NextSMS Username</Label>
                   <Input
                     id="nextsmsUsername"
                     placeholder="Your NextSMS username"
                     value={apiCredentials.nextsmsUsername}
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setApiCredentials({ ...apiCredentials, nextsmsUsername: e.target.value })}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="nextsmsPassword">NextSMS Password</Label>
                   <Input
                     id="nextsmsPassword"
                     type="password"
                     placeholder="Your NextSMS password"
                     value={apiCredentials.nextsmsPassword}
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setApiCredentials({ ...apiCredentials, nextsmsPassword: e.target.value })}
                   />
                 </div>
               </div>
               <p className="text-xs text-gray-500 text-center">Enter Username/Password OR the full Auth Token below.</p>

               {/* Auth Token Input */}
              <div className="space-y-2">
                <Label htmlFor="nextsmsAuth">NextSMS Auth Token (Optional if using Username/Password)</Label>
                <Input
                  id="nextsmsAuth"
                  type="password"
                  placeholder="Or enter the full 'Basic ...' token"
                  value={apiCredentials.nextsmsAuth}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setApiCredentials({ ...apiCredentials, nextsmsAuth: e.target.value })}
                  disabled={!!(apiCredentials.nextsmsUsername && apiCredentials.nextsmsPassword)} // Disable if user/pass entered
                />
                 <p className="text-xs text-gray-500">
                   Starts with <code>Basic </code> followed by Base64 encoded <code>username:password</code>.
                 </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderId">Sender ID</Label>
                <Input
                  id="senderId"
                  placeholder="BBASPA"
                  value={apiCredentials.senderId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setApiCredentials({ ...apiCredentials, senderId: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  This is the name that will appear as the sender of your SMS messages (max 11 alphanumeric characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openrouterApiKey">OpenRouter API Key (for AI features)</Label>
                <Input
                  id="openrouterApiKey"
                  type="password"
                  placeholder="Enter your OpenRouter API key"
                  value={apiCredentials.openrouterApiKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setApiCredentials({ ...apiCredentials, openrouterApiKey: e.target.value })}
                />
                <p className="text-xs text-gray-500">Required for AI-powered message generation and auto-replies</p>
              </div>

              <div className="mt-4 rounded-md bg-gray-50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Current SMS Balance</div>
                    {loadingBalance ? (
                      <div className="mt-1 text-2xl font-bold flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : balanceError ? (
                      <div className="mt-1 text-sm text-red-500">{balanceError}</div>
                    ) : (
                      <div className="mt-1 text-2xl font-bold">{smsBalance !== null ? smsBalance : "N/A"}</div>
                    )}
                    <p className="text-xs text-gray-500">Available SMS credits</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshBalance}
                    disabled={loadingBalance || !nextsmsApi.isConfigured}
                  >
                    {loadingBalance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      "Refresh Balance"
                    )}
                  </Button>
                </div>
              </div>

              {balanceError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error fetching balance</AlertTitle>
                  <AlertDescription>
                    {balanceError}. Please check your API credentials and ensure they are correctly formatted.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Authentication Format</AlertTitle>
                <AlertDescription>
                  <p>
                    Your NextSMS auth token should be in the format <code>username:password</code> encoded in Base64, or
                    prefixed with <code>Basic </code>.
                  </p>
                  <p className="mt-1">
                    Example: <code>Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==</code>
                  </p>
                  <p className="mt-1">You can use an online Base64 encoder to create your token.</p>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveCredentials} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Credentials"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>Configure your business information for AI-generated messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Acme Inc."
                  value={businessSettings.businessName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBusinessSettings({ ...businessSettings, businessName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan or Tagline</Label>
                <Input
                  id="slogan"
                  placeholder="Quality products for everyone"
                  value={businessSettings.slogan}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBusinessSettings({ ...businessSettings, slogan: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <select
                  id="businessType"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={businessSettings.businessType}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setBusinessSettings({ ...businessSettings, businessType: e.target.value })}
                >
                  <option value="">Select business type</option>
                  <option value="retail">Retail</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="service">Service</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your business, its mission, and values"
                  className="min-h-[100px]"
                  value={businessSettings.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBusinessSettings({ ...businessSettings, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="products">Products or Services</Label>
                <Textarea
                  id="products"
                  placeholder="List your main products or services with prices"
                  className="min-h-[100px]"
                  value={businessSettings.products}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBusinessSettings({ ...businessSettings, products: e.target.value })}
                />
                <p className="text-xs text-gray-500">Format: One product per line, e.g., "- Premium Widget: $99.99"</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveBusinessSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Business Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive important notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="campaignReports">Campaign Reports</Label>
                  <p className="text-xs text-gray-500">Receive reports when campaigns complete</p>
                </div>
                <Switch
                  id="campaignReports"
                  checked={notificationSettings.campaignReports}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, campaignReports: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lowBalanceAlerts">Low Balance Alerts</Label>
                  <p className="text-xs text-gray-500">Get notified when your SMS balance is low</p>
                </div>
                <Switch
                  id="lowBalanceAlerts"
                  checked={notificationSettings.lowBalanceAlerts}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, lowBalanceAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="aiAutoReply">AI Auto-Reply</Label>
                  <p className="text-xs text-gray-500">Automatically respond to incoming messages with AI</p>
                </div>
                <Switch
                  id="aiAutoReply"
                  checked={notificationSettings.aiAutoReply}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, aiAutoReply: checked })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotificationSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Notification Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test SMS</CardTitle>
              <CardDescription>Send a test SMS to verify your configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhoneNumber">Phone Number</Label>
                <Input
                  id="testPhoneNumber"
                  placeholder="255764738005"
                  value={testPhoneNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTestPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500">Enter the phone number with country code (e.g., 255764738005)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Test Message</Label>
                <Textarea
                  id="testMessage"
                  placeholder="Enter your test message"
                  className="min-h-[100px]"
                  value={testMessage}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTestMessage(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Character count: {testMessage.length} | SMS count:{" "}
                  {testMessage.length <= 160 ? 1 : Math.ceil(testMessage.length / 153)}
                </p>
              </div>

              {testError && (
                <Alert variant="destructive">
                  <AlertTitle>Error sending test message</AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}

              {testSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">Test message sent successfully</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your test message has been sent to {testPhoneNumber}. Check your phone to confirm receipt.
                  </AlertDescription>
                </Alert>
              )}

              {!nextsmsApi.isConfigured && (
                <Alert className="bg-yellow-50 border-yellow-200"> {/* Removed variant="warning" */}
                  <AlertTitle className="text-yellow-800">API credentials not configured</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Please save your NextSMS credentials in the API Credentials tab before sending a test message.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSendTestSMS}
                disabled={isSendingTest || !nextsmsApi.isConfigured}
                className="flex items-center"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
