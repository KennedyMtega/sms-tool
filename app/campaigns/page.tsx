import { getCampaigns } from "@/lib/campaign-service";
import CampaignsClient from "./campaigns-client";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  return <CampaignsClient initialCampaigns={campaigns} />;
}
