import { Suspense } from "react"
import { SAMPLE_CAMPAIGNS } from "@/lib/sample-data"
import { SAMPLE_CONTACTS } from "@/lib/sample-data"
import { SAMPLE_MESSAGES } from "@/lib/sample-data"
import DashboardClient from "./dashboard-client"
import DashboardSkeleton from "@/components/skeletons/dashboard-skeleton"

export default function DashboardPage() {
  // Use sample data directly to avoid any loading errors
  const campaigns = SAMPLE_CAMPAIGNS
  const contacts = SAMPLE_CONTACTS
  const recentMessages = SAMPLE_MESSAGES.slice(0, 5)
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
