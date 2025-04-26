import { getSupabaseClient } from "./supabase-client"

export type UserCredentials = {
  user_id: string
  nextsms_username: string
  nextsms_password: string
  nextsms_auth: string
  openrouter_api_key: string
  sender_id: string
  created_at: string
  updated_at: string
}

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

export async function getUserCredentials(): Promise<UserCredentials> {
  const supabase = getSupabaseClient()
  
  // Get the actual user ID from authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("user_credentials")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) {
    console.error("Error fetching user credentials:", error)
    // Return default credentials if not found
    return {
      user_id: user.id,
      nextsms_username: "",
      nextsms_password: "",
      nextsms_auth: "",
      openrouter_api_key: "",
      sender_id: "N-SMS",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return data
}

export async function updateUserCredentials(credentials: Partial<UserCredentials>): Promise<UserCredentials> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("user_credentials")
    .update({ ...credentials, updated_at: new Date().toISOString() })
    .eq("user_id", credentials.user_id)
    .select()
    .single()

  if (error) {
    console.error("Error updating user credentials:", error)
    throw error
  }

  return data
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", "00000000-0000-0000-0000-000000000001").single()

    if (error) {
      console.error("Error fetching user settings:", error)

      // Try to get from localStorage if available
      if (typeof window !== "undefined") {
        const savedSettings = localStorage.getItem("sms_marketing_settings")
        if (savedSettings) {
          try {
            return JSON.parse(savedSettings)
          } catch (e) {
            console.error("Failed to parse saved settings:", e)
          }
        }
      }

      // Return default settings converted to camelCase
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

    // If no data found, create default settings
    if (!data) {
      try {
        const { data: newData, error: insertError } = await supabase
          .from("user_settings")
          .insert({
            user_id: "00000000-0000-0000-0000-000000000001",
            business_name: "Acme Inc.",
            slogan: "Quality products for everyone",
            business_type: "retail",
            description: "Acme Inc. is a leading provider of high-quality products for both consumers and businesses.",
            products: "- Premium Widget: $99.99\n- Basic Widget: $49.99",
            email_notifications: true,
            campaign_reports: true,
            low_balance_alerts: true,
            ai_auto_reply: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error("Error creating default settings:", insertError)
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

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "sms_marketing_settings",
            JSON.stringify({
              businessName: newData.business_name,
              slogan: newData.slogan,
              businessType: newData.business_type,
              description: newData.description,
              products: newData.products,
              emailNotifications: newData.email_notifications,
              campaignReports: newData.campaign_reports,
              lowBalanceAlerts: newData.low_balance_alerts,
              aiAutoReply: newData.ai_auto_reply,
            }),
          )
        }

        return {
          businessName: newData.business_name,
          slogan: newData.slogan,
          businessType: newData.business_type,
          description: newData.description,
          products: newData.products,
          emailNotifications: newData.email_notifications,
          campaignReports: newData.campaign_reports,
          lowBalanceAlerts: newData.low_balance_alerts,
          aiAutoReply: newData.ai_auto_reply,
        }
      } catch (error) {
        console.error("Error creating default settings:", error)
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
    }

    // Convert snake_case to camelCase
    const settings: UserSettings = {
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

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sms_marketing_settings", JSON.stringify(settings))
    }

    return settings
  } catch (error) {
    console.error("Failed to get user settings:", error)
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
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const supabase = getSupabaseClient()

    // Convert camelCase to snake_case for database
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

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Check if settings exist
    const { data: existingData, error: checkError } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", "00000000-0000-0000-0000-000000000001")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // Real error, not just "no rows returned"
      console.error("Error checking existing settings:", checkError)
      throw checkError
    }

    let data
    if (existingData) {
      // Update existing settings
      const { data: updatedData, error } = await supabase
        .from("user_settings")
        .update(updateData)
        .eq("user_id", "00000000-0000-0000-0000-000000000001")
        .select()
        .single()

      if (error) {
        console.error("Error updating user settings:", error)
        throw error
      }

      data = updatedData
    } else {
      // Insert new settings
      const { data: newData, error } = await supabase
        .from("user_settings")
        .insert({ ...updateData, user_id: "00000000-0000-0000-0000-000000000001" })
        .select()
        .single()

      if (error) {
        console.error("Error creating user settings:", error)
        throw error
      }

      data = newData
    }

    // Convert snake_case back to camelCase
    const updatedSettings: UserSettings = {
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

    // Update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sms_marketing_settings", JSON.stringify(updatedSettings))
    }

    return updatedSettings
  } catch (error) {
    console.error("Failed to update user settings:", error)

    // Still update localStorage even if Supabase fails
    if (typeof window !== "undefined" && settings) {
      const savedSettings = localStorage.getItem("sms_marketing_settings")
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings)
          const updatedSettings = {
            ...parsedSettings,
            ...settings,
          }
          localStorage.setItem("sms_marketing_settings", JSON.stringify(updatedSettings))
        } catch (e) {
          console.error("Failed to update saved settings:", e)
        }
      }
    }

    throw error
  }
}
