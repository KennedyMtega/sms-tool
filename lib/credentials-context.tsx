"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "./supabase-client"

export type Credentials = {
  nextsmsUsername?: string;
  nextsmsPassword?: string;
  nextsmsAuth: string;
  openrouterApiKey: string;
  senderId: string;
}

type CredentialsContextType = {
  credentials: Credentials
  isConfigured: boolean
  isLoading: boolean
  updateCredentials: (newCredentials: Partial<Credentials>) => Promise<void>
}

const defaultCredentials: Credentials = {
  nextsmsAuth: "",
  openrouterApiKey: "",
  senderId: "BBASPA",
}

// Function to generate Basic Auth token from username and password
function generateBasicAuth(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

const CredentialsContext = createContext<CredentialsContextType>({
  credentials: defaultCredentials,
  isConfigured: false,
  isLoading: true,
  updateCredentials: async () => {},
})

// For demo purposes, we'll use a fixed user ID
// In a real app, this would come from authentication
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials>(defaultCredentials)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load credentials on mount
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        setIsLoading(true)

        // Try to load from localStorage first (for faster initial load)
        if (typeof window !== "undefined") {
          const savedCredentials = localStorage.getItem("sms_marketing_credentials")
          if (savedCredentials) {
            try {
              const parsedCredentials = JSON.parse(savedCredentials)
              setCredentials(parsedCredentials)

              // Check if both required credentials are present and non-empty
              const hasNextsmsAuth = parsedCredentials.nextsmsAuth && parsedCredentials.nextsmsAuth.trim() !== ""
              const hasOpenrouterApiKey =
                parsedCredentials.openrouterApiKey && parsedCredentials.openrouterApiKey.trim() !== ""

              if (hasNextsmsAuth && hasOpenrouterApiKey) {
                setIsConfigured(true)
                setIsLoading(false) // If we have valid credentials in localStorage, we can stop loading
                console.log("Loaded valid credentials from localStorage")
                return // Skip Supabase check if we already have valid credentials
              }
            } catch (error) {
              console.error("Failed to parse saved credentials:", error)
            }
          }
        }

        // Then try to load from Supabase
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase
            .from("user_credentials")
            .select("*")
            .eq("user_id", DEMO_USER_ID)
            .single()

          if (!error && data) {
            const supabaseCredentials = {
              nextsmsAuth: data.nextsms_auth || "",
              openrouterApiKey: data.openrouter_api_key || "",
              senderId: data.sender_id || "N-SMS",
            }

            setCredentials(supabaseCredentials)

            // Check if both required credentials are present and non-empty
            const hasNextsmsAuth = supabaseCredentials.nextsmsAuth && supabaseCredentials.nextsmsAuth.trim() !== ""
            const hasOpenrouterApiKey =
              supabaseCredentials.openrouterApiKey && supabaseCredentials.openrouterApiKey.trim() !== ""
            setIsConfigured(hasNextsmsAuth && hasOpenrouterApiKey)

            console.log("Loaded credentials from Supabase:", {
              hasNextsmsAuth,
              hasOpenrouterApiKey,
              isConfigured: hasNextsmsAuth && hasOpenrouterApiKey,
            })

            // Update localStorage with the latest data
            localStorage.setItem("sms_marketing_credentials", JSON.stringify(supabaseCredentials))
          }
        } catch (error) {
          console.error("Failed to load credentials from Supabase:", error)
        }

        // Check environment variables as a last resort
        if (!isConfigured) {
          const envNextsmsAuth = process.env.NEXTSMS_AUTH || ""
          const envOpenrouterApiKey = process.env.OPENROUTER_API_KEY || ""

          if (envNextsmsAuth && envOpenrouterApiKey) {
            const envCredentials = {
              ...credentials,
              nextsmsAuth: envNextsmsAuth,
              openrouterApiKey: envOpenrouterApiKey,
            }

            setCredentials(envCredentials)
            setIsConfigured(true)
            console.log("Using environment variables for credentials")

            // Save to localStorage for future use
            localStorage.setItem("sms_marketing_credentials", JSON.stringify(envCredentials))
          }
        }
      } catch (error) {
        console.error("Failed to load credentials:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCredentials()
  }, [])

  // Update credentials in localStorage and Supabase
  const updateCredentials = async (newCredentials: Partial<Credentials>) => {
    try {
      const formattedCredentials = { ...newCredentials };

      // Format the auth token if username and password are provided
      if (formattedCredentials.nextsmsUsername && formattedCredentials.nextsmsPassword) {
        formattedCredentials.nextsmsAuth = generateBasicAuth(
          formattedCredentials.nextsmsUsername,
          formattedCredentials.nextsmsPassword
        );
      } else if (formattedCredentials.nextsmsAuth && !formattedCredentials.nextsmsAuth.startsWith("Basic ")) {
        // Ensure auth token has "Basic " prefix if not already present
        formattedCredentials.nextsmsAuth = `Basic ${formattedCredentials.nextsmsAuth}`;
      }

      const updated = { ...credentials, ...formattedCredentials };

      // Validate credentials
      const hasNextsmsAuth = updated.nextsmsAuth && 
        updated.nextsmsAuth.trim() !== "" && 
        updated.nextsmsAuth.startsWith("Basic ");
      
      const hasOpenrouterApiKey = updated.openrouterApiKey && 
        updated.openrouterApiKey.trim() !== "";

      const newIsConfigured = hasNextsmsAuth && hasOpenrouterApiKey;

      // Update state and storage
      setCredentials(updated);
      setIsConfigured(newIsConfigured);

      console.log("Updated credentials:", {
        hasNextsmsAuth,
        hasOpenrouterApiKey,
        isConfigured: newIsConfigured,
      })

      // Save to localStorage
      localStorage.setItem("sms_marketing_credentials", JSON.stringify(updated))

      // Save to cookie for API routes
      document.cookie = `sms_marketing_credentials=${JSON.stringify(updated)}; path=/; max-age=31536000; SameSite=Strict`

      // Save to Supabase
      const supabase = getSupabaseClient()

      // Check if credentials already exist
      const { data: existingData, error: checkError } = await supabase
        .from("user_credentials")
        .select("user_id")
        .eq("user_id", DEMO_USER_ID)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // Real error, not just "no rows returned"
        console.error("Error checking existing credentials:", checkError)
        throw checkError
      }

      if (existingData) {
        // Update existing credentials
        const { error: updateError } = await supabase
          .from("user_credentials")
          .update({
            nextsms_auth: updated.nextsmsAuth,
            openrouter_api_key: updated.openrouterApiKey,
            sender_id: updated.senderId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", DEMO_USER_ID)

        if (updateError) {
          console.error("Error updating credentials:", updateError)
          throw updateError
        }
      } else {
        // Insert new credentials
        const { error: insertError } = await supabase.from("user_credentials").insert({
          user_id: DEMO_USER_ID,
          nextsms_auth: updated.nextsmsAuth,
          openrouter_api_key: updated.openrouterApiKey,
          sender_id: updated.senderId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Error inserting credentials:", insertError)
          throw insertError
        }
      }

      toast({
        title: "Credentials saved",
        description: "Your API credentials have been saved successfully",
      })
    } catch (error: any) {
      console.error("Failed to update credentials:", error)

      // Still update localStorage even if Supabase fails
      const updated = { ...credentials, ...newCredentials }
      localStorage.setItem("sms_marketing_credentials", JSON.stringify(updated))

      // Check if both required credentials are present and non-empty
      const hasNextsmsAuth = updated.nextsmsAuth && updated.nextsmsAuth.trim() !== ""
      const hasOpenrouterApiKey = updated.openrouterApiKey && updated.openrouterApiKey.trim() !== ""
      setIsConfigured(hasNextsmsAuth && hasOpenrouterApiKey)

      toast({
        title: "Credentials partially saved",
        description: "Your credentials were saved locally but not to the database. Some features may be limited.",
        variant: "destructive",
      })
    }
  }

  return (
    <CredentialsContext.Provider value={{ credentials, isConfigured, isLoading, updateCredentials }}>
      {children}
    </CredentialsContext.Provider>
  )
}

export function useCredentials() {
  const context = useContext(CredentialsContext)
  if (context === undefined) {
    throw new Error("useCredentials must be used within a CredentialsProvider")
  }
  return context
}
