"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, MessageSquare, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { CampaignPerformanceChart } from "@/components/dashboard/campaign-performance-chart"
import { RecentMessagesTable } from "@/components/dashboard/recent-messages-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { WelcomeMessage } from "@/components/dashboard/welcome-message"
import type { Campaign } from "@/lib/campaign-service"
import type { Contact } from "@/lib/contact-service"
import type { Message } from "@/lib/message-service"
import type { UserSettings } from "@/lib/settings-service"

interface DashboardClientProps {
  initialCampaigns: Campaign[]
  initialContacts: Contact[]
  initialRecentMessages: Message[]
  initialUserSettings: UserSettings
}

export default function DashboardClient({
  initialCampaigns,
  initialContacts,
  initialRecentMessages,
  initialUserSettings,
}: DashboardClientProps) {
  const [campaigns] = useState<Campaign[]>(initialCampaigns)
  const [contacts] = useState<Contact[]>(initialContacts)
  const [recentMessages] = useState<Message[]>(initialRecentMessages)
  const [userSettings] = useState<UserSettings>(initialUserSettings)

  // Calculate stats
  const totalContacts = contacts.length
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length
  const totalMessages = campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0)

  // Get active campaigns for chart
  const activeCampaignsData = campaigns
    .filter((campaign) => campaign.status === "active" || campaign.status === "completed")
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      <WelcomeMessage businessName={userSettings.business_name} />

      <StatsCards
        totalContacts={totalContacts}
        totalCampaigns={totalCampaigns}
        activeCampaigns={activeCampaigns}
        totalMessages={totalMessages}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Your latest SMS messages</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/messages">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentMessagesTable messages={recentMessages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Delivery and response rates</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/campaigns">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <CampaignPerformanceChart campaigns={activeCampaignsData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)} •{campaign.sent_count}{" "}
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
