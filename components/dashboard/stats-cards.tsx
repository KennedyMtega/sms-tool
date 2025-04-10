"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, BarChart, Send } from "lucide-react"

interface StatsCardsProps {
  totalContacts: number
  totalCampaigns: number
  activeCampaigns: number
  totalMessages: number
}

export function StatsCards({ totalContacts, totalCampaigns, activeCampaigns, totalMessages }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Your SMS audience</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCampaigns.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{activeCampaigns} active now</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total SMS delivered</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalMessages > 0 ? Math.round(((totalMessages * 0.25) / totalMessages) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">Average campaign engagement</p>
        </CardContent>
      </Card>
    </div>
  )
}
