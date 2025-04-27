import { Suspense } from "react"
import DashboardClient from "./dashboard-client"
import DashboardSkeleton from "@/components/skeletons/dashboard-skeleton"
import type { Campaign } from "@/lib/campaign-service"
import type { Contact } from "@/lib/contact-service"
import type { Message } from "@/lib/types"

export default function DashboardPage() {
  // Use empty arrays or fallback logic instead of sample data
  const campaigns: Campaign[] = []
  const contacts: Contact[] = []
  const recentMessages: Message[] = []
  const userSettings = {
    businessName: "Acme Inc.",
    slogan: "Quality products for everyone",
    businessType: "retail",
    description: "Acme Inc. is a leading provider of high-quality products for both consumers and businesses.",
    products: "- Premium Widget: $99.99\n- Basic Widget: $49.99",
    emailNotifications: true,
    campaignReports: true,
    lowBalanceAlerts: true,
    aiAutoReply: true,
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        initialCampaigns={campaigns}
        initialContacts={contacts}
        initialRecentMessages={recentMessages}
        initialUserSettings={userSettings}
      />
    </Suspense>
  )
}
