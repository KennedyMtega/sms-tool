import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, ArrowUpRight, Calendar, BarChart3, AlertCircle, RefreshCw, Plus } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase-client"
import { cookies } from "next/headers"
import { useState } from "react"
import SmsBalanceCard from "@/components/SmsBalanceCard"
import { WelcomeMessage } from "@/components/WelcomeMessage"

export default async function Dashboard() {
  // Fetch all stats and config from Supabase
  const supabase = getSupabaseClient()
  // Fetch contacts
  const { data: contacts = [] } = await supabase.from("contacts").select("id")
  // Fetch campaigns
  const { data: campaigns = [] } = await supabase.from("campaigns").select("id, status, sent_count, name")
  // Fetch messages
  const { data: messages = [] } = await supabase.from("messages").select("id")
  // Fetch user settings (for business name, etc.)
  const { data: settings } = await supabase.from("user_settings").select("business_name, slogan").single()

  // Calculate stats
  const contactCount = contacts.length
  const messageCount = messages.length
  const activeCampaignCount = campaigns.filter((c: any) => c.status === "active").length
  const recentCampaigns = campaigns.slice(-5).reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <WelcomeMessage businessName={settings?.business_name || "SMS Marketing"} />
        <div className="flex items-center gap-4">
          <Link href="/contacts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactCount}</div>
            <p className="text-xs text-gray-500">Your contact database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageCount}</div>
            <p className="text-xs text-gray-500">Total messages processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaignCount}</div>
            <p className="text-xs text-gray-500">Currently running campaigns</p>
          </CardContent>
        </Card>

        <SmsBalanceCard />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.length === 0 ? (
                <div className="py-4 text-center text-gray-500">No campaign data available</div>
              ) : (
                recentCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-gray-500">
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)} • {campaign.sent_count} sent
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/campaigns/${campaign.id}`}>View</Link>
                    </Button>
                  </div>
                ))
              )}
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
