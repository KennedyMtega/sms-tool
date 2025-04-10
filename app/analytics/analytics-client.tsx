"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { Campaign } from "@/lib/campaign-service"
import type { Message } from "@/lib/message-service"
import type { Contact } from "@/lib/contact-service"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AnalyticsClientProps {
  initialCampaigns: Campaign[]
  initialMessages: Message[]
  initialContacts: Contact[]
}

export default function AnalyticsClient({ initialCampaigns, initialMessages, initialContacts }: AnalyticsClientProps) {
  const [campaigns] = useState<Campaign[]>(initialCampaigns)
  const [messages] = useState<Message[]>(initialMessages)
  const [contacts] = useState<Contact[]>(initialContacts)

  // Calculate stats
  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0)
  const totalDelivered = campaigns.reduce((sum, campaign) => sum + campaign.delivered_count, 0)
  const totalResponses = campaigns.reduce((sum, campaign) => sum + campaign.response_count, 0)
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0
  const responseRate = totalDelivered > 0 ? Math.round((totalResponses / totalDelivered) * 100) : 0

  // Prepare campaign performance data
  const campaignPerformanceData = campaigns
    .filter((campaign) => campaign.status === "active" || campaign.status === "completed")
    .slice(0, 5)
    .map((campaign) => ({
      name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + "..." : campaign.name,
      sent: campaign.sent_count,
      delivered: campaign.delivered_count,
      responses: campaign.response_count,
    }))

  // Prepare message status data
  const messageStatusData = [
    { name: "Sent", value: messages.filter((m) => m.status === "sent").length || 1 },
    { name: "Delivered", value: messages.filter((m) => m.status === "delivered").length || 2 },
    { name: "Failed", value: messages.filter((m) => m.status === "failed").length || 0 },
    { name: "Received", value: messages.filter((m) => m.status === "received").length || 1 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">Total contacts in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">{totalDelivered} delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">Of all messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <p className="text-xs text-muted-foreground">Of delivered messages</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="messages">Message Status</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Comparison of sent, delivered, and response counts for recent campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sent: {
                    label: "Sent",
                    color: "hsl(var(--chart-1))",
                  },
                  delivered: {
                    label: "Delivered",
                    color: "hsl(var(--chart-2))",
                  },
                  responses: {
                    label: "Responses",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                {campaignPerformanceData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No campaign data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="sent" name="Sent" fill="var(--color-sent)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="delivered" name="Delivered" fill="var(--color-delivered)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="responses" name="Responses" fill="var(--color-responses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Message Status Distribution</CardTitle>
              <CardDescription>Breakdown of message statuses across all campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={messageStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {messageStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} messages`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
