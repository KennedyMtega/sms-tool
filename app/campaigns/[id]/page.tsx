import { getCampaign } from "@/lib/campaign-service"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MessageSquare, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  // Fetch campaign on the server
  const campaign = await getCampaign(params.id)

  if (!campaign) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <Badge
            variant={
              campaign.status === "active"
                ? "default"
                : campaign.status === "scheduled"
                  ? "outline"
                  : campaign.status === "completed"
                    ? "secondary"
                    : "destructive"
            }
          >
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/campaigns/${campaign.id}/edit`}>Edit Campaign</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic information about this campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Sender ID</div>
              <div>{campaign.sender_id}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Created</div>
              <div>{format(new Date(campaign.created_at), "PPPp")}</div>
            </div>
            {campaign.scheduled_date && (
              <div className="space-y-1">
                <div className="font-medium">Scheduled Date</div>
                <div>{format(new Date(campaign.scheduled_date), "PPPp")}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-500">Message</div>
              <div className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">{campaign.message}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Campaign delivery statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-1 text-center">
                <div className="text-3xl font-bold">{campaign.sent_count.toLocaleString()}</div>
                <div className="text-xs text-gray-500 flex items-center justify-center">
                  <MessageSquare className="mr-1 h-3 w-3" /> Sent
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-3xl font-bold">{campaign.delivered_count.toLocaleString()}</div>
                <div className="text-xs text-gray-500 flex items-center justify-center">
                  <Calendar className="mr-1 h-3 w-3" /> Delivered
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-3xl font-bold">{campaign.response_count.toLocaleString()}</div>
                <div className="text-xs text-gray-500 flex items-center justify-center">
                  <Users className="mr-1 h-3 w-3" /> Responses
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-gray-500">
                <span>Delivery Rate</span>
                <span>
                  {campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${
                      campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-gray-500">
                <span>Response Rate</span>
                <span>
                  {campaign.delivered_count > 0
                    ? Math.round((campaign.response_count / campaign.delivered_count) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${
                      campaign.delivered_count > 0
                        ? Math.round((campaign.response_count / campaign.delivered_count) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
