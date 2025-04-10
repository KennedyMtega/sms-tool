"use client"

import CredentialsAlert from "@/components/dashboard/credentials-alert"
import SmsBalanceCard from "@/components/dashboard/sms-balance-card"

export function DashboardClientWrapper() {
  return (
    <>
      <div className="credentials-alert-container">
        <CredentialsAlert />
      </div>
      <div className="sms-balance-card-container">
        <SmsBalanceCard />
      </div>
    </>
  )
}
