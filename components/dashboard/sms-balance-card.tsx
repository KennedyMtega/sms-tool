"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, RefreshCw } from "lucide-react"
import { useCredentials } from "@/lib/credentials-context"
import { useNextsmsApi } from "@/lib/nextsms-api"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function SmsBalanceCard() {
  const { isConfigured } = useCredentials()
  const nextsmsApi = useNextsmsApi()
  const { toast } = useToast()
  const [smsBalance, setSmsBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchBalance = async () => {
    if (!isConfigured) {
      toast({
        title: "API not configured",
        description: "Please configure your API credentials in settings.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      const balance = await nextsmsApi.getSMSBalance()
      setSmsBalance(balance.sms_balance)
      toast({
        title: "Balance updated",
        description: `Your current SMS balance is ${balance.sms_balance}`,
      })
    } catch (error: any) {
      console.error("Failed to fetch SMS balance:", error)
      toast({
        title: "Failed to fetch balance",
        description: error.message || "An error occurred while fetching your SMS balance",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto md:max-w-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">SMS Balance</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchBalance} 
          disabled={loading}
          title="Refresh SMS balance"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold">Loading...</div>
        ) : (
          <>
            <div className="text-2xl font-bold">{smsBalance !== null ? smsBalance : "N/A"}</div>
            <p className="text-xs text-gray-500">
              {isConfigured ? 
                smsBalance !== null ? 
                  "Available SMS credits" : 
                  "Click refresh to check balance" : 
                "Configure API credentials to view balance"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
