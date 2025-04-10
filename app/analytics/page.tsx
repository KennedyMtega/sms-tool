import { Suspense } from "react"
import { SAMPLE_CAMPAIGNS } from "@/lib/sample-data"
import { SAMPLE_CONTACTS } from "@/lib/sample-data"
import { SAMPLE_MESSAGES } from "@/lib/sample-data"
import AnalyticsClient from "./analytics-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsPage() {
  // Use sample data directly to avoid any loading errors
  const campaigns = SAMPLE_CAMPAIGNS
  const contacts = SAMPLE_CONTACTS
  const messages = SAMPLE_MESSAGES

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AnalyticsClient initialCampaigns={campaigns} initialMessages={messages} initialContacts={contacts} />
    </Suspense>
  )
}
