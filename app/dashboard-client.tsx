"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, MessageSquare, Users, Calendar, BarChart3, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useCredentials } from "@/lib/credentials-context"
import { useNextsmsApi } from "@/lib/nextsms-api"
import type { Campaign } from "@/lib/campaign-service"
import type { Contact } from "@/lib/contact-service"
import type { Message } from "@/lib/message-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface DashboardClientProps {
  initialCampaigns: Campaign[]
  initialContacts: Contact[]
  initialRecentMessages: Message[]
  initialUserSettings: any
}

export default function DashboardClient({
  initialCampaigns,
  initialContacts,
  initialRecentMessages,
  initialUserSettings,
}: DashboardClientProps) {
  const { credentials, isConfigured, isLoading: credentialsLoading } = useCredentials()
  const nextsmsApi = useNextsmsApi()
  const [campaigns] = useState<Campaign[]>(initialCampaigns)
  const [contacts] = useState<Contact[]>(initialContacts)
  const [recentMessages] = useState<Message[]>(initialRecentMessages)
  const [userSettings] = useState<any>(initialUserSettings)
  const [smsBalance, setSmsBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Fetch SMS balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConfigured) {
        try {
          setLoadingBalance(true)
          const balance = await nextsmsApi.getSMSBalance()
          setSmsBalance(balance.sms_balance)
        } catch (error) {
          console.error("Failed to fetch SMS balance:", error)
        } finally {
          setLoadingBalance(false)
        }
      }
    }

    if (isConfigured && !credentialsLoading) {
      fetchBalance()
    }
  }, [isConfigured, nextsmsApi, credentialsLoading])

  // Calculate stats
  const totalContacts = contacts.length
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length
  const totalMessages = campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0)
  const deliveryRate =
    totalMessages > 0
      ? Math.round((campaigns.reduce((sum, campaign) => sum + campaign.delivered_count, 0) / totalMessages) * 100)
      : 0
  const responseRate =
    totalMessages > 0
      ? Math.round((campaigns.reduce((sum, campaign) => sum + campaign.response_count, 0) / totalMessages) * 100)
      : 0

  console.log("Dashboard credentials status:", { isConfigured, credentialsLoading, credentials })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome to {userSettings.businessName}</h1>
          <p className="text-gray-500">{userSettings.slogan}</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            Create Campaign <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {!isConfigured && !credentialsLoading && (
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
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-gray-500">Your contact database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-gray-500">Delivery rate: {deliveryRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-gray-500">Out of {totalCampaigns} total campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SMS Balance</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalance
                ? "Loading..."
                : smsBalance !== null
                  ? smsBalance
                  : isConfigured
                    ? "N/A"
                    : "Not configured"}
            </div>
            <p className="text-xs text-gray-500">
              {isConfigured ? "Available SMS credits" : "Configure API credentials to view balance"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length === 0 ? (
                <div className="py-4 text-center text-gray-500">No recent messages found.</div>
              ) : (
                recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-4 rounded-lg border p-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">{message.contact?.name || "Unknown"}</p>
                        <Badge
                          variant={
                            message.status === "delivered"
                              ? "default"
                              : message.status === "sent"
                                ? "outline"
                                : message.status === "received"
                                  ? "secondary"
                                  : "destructive"
                          }
                          className="ml-auto"
                        >
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{message.contact?.phone || "Unknown number"}</p>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="flex justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/messages">
                    View All Messages <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button asChild className="h-auto flex-col gap-2 p-4">
                <Link href="/messages/new">
                  <MessageSquare className="h-6 w-6" />
                  <div className="text-sm font-medium">Send Message</div>
                  <div className="text-xs text-muted-foreground">Send a quick SMS to a contact</div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/contacts/new">
                  <Users className="h-6 w-6" />
                  <div className="text-sm font-medium">Add Contact</div>
                  <div className="text-xs text-muted-foreground">Create a new contact</div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/campaigns/new">
                  <Calendar className="h-6 w-6" />
                  <div className="text-sm font-medium">Create Campaign</div>
                  <div className="text-xs text-muted-foreground">Start a new SMS campaign</div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Your SMS marketing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns">
            <TabsList className="mb-4">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>
            <TabsContent value="campaigns">
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No campaigns found</div>
                ) : (
                  campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)} • {campaign.sent_count}{" "}
                          sent
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/campaigns/${campaign.id}`}>View</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="contacts">
              <div className="space-y-4">
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No contacts found</div>
                ) : (
                  contacts.slice(0, 5).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/contacts/${contact.id}`}>View</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
