"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { type Campaign, getCampaigns } from "@/lib/campaign-service"

// Sample data to use when no campaigns are available
const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Summer Sale Announcement",
    status: "active",
    sender_id: "N-SMS",
    message:
      "Summer SALE! 🔥 Get 20% OFF all products this weekend only. Use code SUMMER20 at checkout. Limited time offer! Reply STOP to opt out.",
    scheduled_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sent_count: 1250,
    delivered_count: 1230,
    response_count: 320,
  },
  {
    id: "2",
    name: "New Product Launch",
    status: "scheduled",
    sender_id: "N-SMS",
    message:
      "Exciting news! Our new premium widget is now available. Be the first to try it out at www.example.com/new-product. Reply STOP to opt out.",
    scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sent_count: 0,
    delivered_count: 0,
    response_count: 0,
  },
]

interface CampaignsClientProps {
  initialCampaigns: Campaign[]
}

export default function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(
    initialCampaigns.length > 0 ? initialCampaigns : SAMPLE_CAMPAIGNS,
  )
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Refresh campaigns data
  useEffect(() => {
    const refreshCampaigns = async () => {
      if (initialCampaigns.length === 0) {
        try {
          setLoading(true)
          const freshCampaigns = await getCampaigns()
          if (freshCampaigns.length > 0) {
            setCampaigns(freshCampaigns)
          }
        } catch (error) {
          console.error("Error refreshing campaigns:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    refreshCampaigns()
  }, [initialCampaigns])

  // Filter campaigns based on search term and status filter
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>Manage and monitor your SMS marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "active"
                            ? "default"
                            : campaign.status === "scheduled"
                              ? "outline"
                              : campaign.status === "completed"
                                ? "secondary"
                                : campaign.status === "paused"
                                  ? "secondary"
                                  : "destructive"
                        }
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.sent_count.toLocaleString()}</TableCell>
                    <TableCell>{campaign.delivered_count.toLocaleString()}</TableCell>
                    <TableCell>{campaign.response_count.toLocaleString()}</TableCell>
                    <TableCell>
                      {campaign.scheduled_date
                        ? format(new Date(campaign.scheduled_date), "yyyy-MM-dd")
                        : format(new Date(campaign.created_at), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/campaigns/${campaign.id}/edit`}>Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/campaigns/${campaign.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
