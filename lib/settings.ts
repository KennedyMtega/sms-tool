import { getSupabaseClient, getServerSupabaseClient } from "./supabase"

// For demo purposes, we'll use a fixed user ID
// In a real app, this would come from authentication
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

export type UserSettings = {
  businessName: string
  slogan: string
  businessType: string
  description: string
  products: string
  emailNotifications: boolean
  campaignReports: boolean
  lowBalanceAlerts: boolean
  aiAutoReply: boolean
}

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", DEMO_USER_ID).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    throw error
  }

  if (!data) {
    // Create default settings if none exist
    const defaultSettings = {
      user_id: DEMO_USER_ID,
      business_name: "Acme Inc.",
      slogan: "Quality products for everyone",
      business_type: "retail",
      description:
        "Acme Inc. is a leading provider of high-quality products for both consumers and businesses. Established in 2010, we pride ourselves on excellent customer service and innovative solutions.",
      products:
        "- Premium Widget: $99.99\n- Basic Widget: $49.99\n- Widget Repair Service: $25/hour\n- Custom Widget Design: Contact for pricing",
      email_notifications: true,
      campaign_reports: true,
      low_balance_alerts: true,
      ai_auto_reply: true,
    }

    const { data: newData, error: insertError } = await supabase
      .from("user_settings")
      .insert(defaultSettings)
      .select()
      .single()

    if (insertError) throw insertError

    return {
      businessName: defaultSettings.business_name,
      slogan: defaultSettings.slogan,
      businessType: defaultSettings.business_type,
      description: defaultSettings.description,
      products: defaultSettings.products,
      emailNotifications: defaultSettings.email_notifications,
      campaignReports: defaultSettings.campaign_reports,
      lowBalanceAlerts: defaultSettings.low_balance_alerts,
      aiAutoReply: defaultSettings.ai_auto_reply,
    }
  }

  return {
    businessName: data.business_name,
    slogan: data.slogan,
    businessType: data.business_type,
    description: data.description,
    products: data.products,
    emailNotifications: data.email_notifications,
    campaignReports: data.campaign_reports,
    lowBalanceAlerts: data.low_balance_alerts,
    aiAutoReply: data.ai_auto_reply,
  }
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const supabase = getSupabaseClient()

  const updateData: Record<string, any> = {}

  if (settings.businessName !== undefined) updateData.business_name = settings.businessName
  if (settings.slogan !== undefined) updateData.slogan = settings.slogan
  if (settings.businessType !== undefined) updateData.business_type = settings.businessType
  if (settings.description !== undefined) updateData.description = settings.description
  if (settings.products !== undefined) updateData.products = settings.products
  if (settings.emailNotifications !== undefined) updateData.email_notifications = settings.emailNotifications
  if (settings.campaignReports !== undefined) updateData.campaign_reports = settings.campaignReports
  if (settings.lowBalanceAlerts !== undefined) updateData.low_balance_alerts = settings.lowBalanceAlerts
  if (settings.aiAutoReply !== undefined) updateData.ai_auto_reply = settings.aiAutoReply

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("user_settings")
    .update(updateData)
    .eq("user_id", DEMO_USER_ID)
    .select()
    .single()

  if (error) throw error

  return {
    businessName: data.business_name,
    slogan: data.slogan,
    businessType: data.business_type,
    description: data.description,
    products: data.products,
    emailNotifications: data.email_notifications,
    campaignReports: data.campaign_reports,
    lowBalanceAlerts: data.low_balance_alerts,
    aiAutoReply: data.ai_auto_reply,
  }
}

// Server-side function to get user settings
export async function getUserSettingsServer(): Promise<UserSettings> {
  const supabase = getServerSupabaseClient()

  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", DEMO_USER_ID).single()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  if (!data) {
    return {
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
  }

  return {
    businessName: data.business_name,
    slogan: data.slogan,
    businessType: data.business_type,
    description: data.description,
    products: data.products,
    emailNotifications: data.email_notifications,
    campaignReports: data.campaign_reports,
    lowBalanceAlerts: data.low_balance_alerts,
    aiAutoReply: data.ai_auto_reply,
  }
}
