"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Campaign } from "@/lib/campaign-service"

interface CampaignPerformanceChartProps {
  campaigns: Campaign[]
}

export function CampaignPerformanceChart({ campaigns }: CampaignPerformanceChartProps) {
  // Transform campaign data for the chart
  const chartData = campaigns.map((campaign) => {
    const deliveryRate =
      campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0

    const responseRate =
      campaign.delivered_count > 0 ? Math.round((campaign.response_count / campaign.delivered_count) * 100) : 0

    return {
      name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + "..." : campaign.name,
      deliveryRate,
      responseRate,
    }
  })

  return (
    <ChartContainer
      config={{
        deliveryRate: {
          label: "Delivery Rate",
          color: "hsl(var(--chart-1))",
        },
        responseRate: {
          label: "Response Rate",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      {campaigns.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500">No campaign data available</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="deliveryRate" name="Delivery Rate" fill="var(--color-deliveryRate)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="responseRate" name="Response Rate" fill="var(--color-responseRate)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}
