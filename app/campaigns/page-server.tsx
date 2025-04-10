import { Suspense } from "react"
import { getCampaigns } from "@/lib/campaign-service"
import CampaignsClient from "./campaigns-client"
import CampaignsTableSkeleton from "@/components/skeletons/campaigns-table-skeleton"

export default async function CampaignsPage() {
  // Fetch campaigns on the server
  const campaigns = await getCampaigns()

  return (
    <Suspense fallback={<CampaignsTableSkeleton />}>
      <CampaignsClient initialCampaigns={campaigns} />
    </Suspense>
  )
}
