"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { useCredentials } from "@/lib/credentials-context"
import { useNextsmsApi } from "@/lib/nextsms-api"
import { useEffect, useState } from "react"

export default function SmsBalanceCard() {
  const { isConfigured } = useCredentials()
  const nextsmsApi = useNextsmsApi()
  const [smsBalance, setSmsBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConfigured) {
        try {
          setLoading(true)
          const balance = await nextsmsApi.getSMSBalance()
          setSmsBalance(balance.sms_balance)
        } catch (error) {
          console.error("Failed to fetch SMS balance:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchBalance()
  }, [isConfigured, nextsmsApi])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">SMS Balance</CardTitle>
        <BarChart3 className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold">Loading...</div>
        ) : (
          <>
            <div className="text-2xl font-bold">{smsBalance !== null ? smsBalance : "N/A"}</div>
            <p className="text-xs text-gray-500">
              {isConfigured ? "Available SMS credits" : "Configure API credentials to view balance"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
