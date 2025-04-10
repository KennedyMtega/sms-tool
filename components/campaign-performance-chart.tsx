"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function CampaignPerformanceChart() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading with a timeout
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8 h-[350px] items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Sample data for the chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
  const sentData = [400, 520, 470, 580, 620, 700]
  const deliveredData = [380, 500, 450, 560, 600, 680]
  const responsesData = [120, 160, 130, 170, 190, 210]

  // Calculate max value for scaling
  const maxValue = Math.max(...sentData)

  return (
    <div className="w-full h-[350px] flex flex-col">
      <div className="flex justify-between mb-2 text-sm text-gray-500">
        <div>Sent</div>
        <div>Delivered</div>
        <div>Responses</div>
      </div>

      <div className="flex space-x-8 h-full">
        {months.map((month, index) => (
          <div key={month} className="flex-1 flex flex-col h-full justify-end">
            <div
              className="w-full bg-[#f43f5e] rounded-t-sm"
              style={{ height: `${(responsesData[index] / maxValue) * 100}%` }}
            />
            <div
              className="w-full bg-[#0ea5e9] rounded-t-sm"
              style={{ height: `${((deliveredData[index] - responsesData[index]) / maxValue) * 100}%` }}
            />
            <div
              className="w-full bg-[#adfa1d] rounded-t-sm"
              style={{ height: `${((sentData[index] - deliveredData[index]) / maxValue) * 100}%` }}
            />
            <div className="text-xs text-center mt-2">{month}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#adfa1d] mr-1 rounded-sm"></div>
          <span className="text-xs">Sent</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#0ea5e9] mr-1 rounded-sm"></div>
          <span className="text-xs">Delivered</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#f43f5e] mr-1 rounded-sm"></div>
          <span className="text-xs">Responses</span>
        </div>
      </div>
    </div>
  )
}
