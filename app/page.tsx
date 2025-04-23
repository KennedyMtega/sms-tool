import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, ArrowUpRight, Calendar, BarChart3, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cookies } from "next/headers"

export default async function Dashboard() {
  // Check if credentials are configured
  const cookieStore = cookies()
  const credentialsCookie = await cookieStore.get("sms_marketing_credentials")
  let isConfigured = false

  // First check cookies
  if (credentialsCookie) {
    try {
      const credentials = JSON.parse(credentialsCookie.value)
      isConfigured = !!(credentials.nextsmsAuth && credentials.openrouterApiKey)
    } catch (e) {
      console.error("Failed to parse credentials cookie:", e)
    }
  }

  // Then check environment variables if cookies don't have credentials
  if (!isConfigured) {
    const envNextsmsAuth = process.env.NEXTSMS_AUTH
    const envOpenrouterApiKey = process.env.OPENROUTER_API_KEY
    isConfigured = !!(envNextsmsAuth && envOpenrouterApiKey)
  }

  // Default stats
  const stats = {
    contactCount: 0,
    messageCount: 0,
    activeCampaignCount: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/campaigns/new">
            Create Campaign <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing API Credentials</AlertTitle>
          <AlertDescription>
            Please configure your Nextsms and OpenRouter credentials in the{" "}
            <Link href="/settings" className="font-medium underline underline-offset-4">
              Settings
            </Link>{" "}
            page to enable full functionality.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactCount}</div>
            <p className="text-xs text-gray-500">Your contact database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messageCount}</div>
            <p className="text-xs text-gray-500">Total messages processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaignCount}</div>
            <p className="text-xs text-gray-500">Currently running campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SMS Balance</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isConfigured ? "Loading..." : "N/A"}</div>
            <p className="text-xs text-gray-500">
              {isConfigured ? "Available SMS credits" : "Configure API credentials to view balance"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] flex items-center justify-center">
              <p className="text-gray-500">No campaign data available</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-gray-500">No recent messages</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
