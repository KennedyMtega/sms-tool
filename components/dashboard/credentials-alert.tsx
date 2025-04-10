"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useCredentials } from "@/lib/credentials-context"

export default function CredentialsAlert() {
  const { isConfigured, isLoading } = useCredentials()

  // Don't show anything while loading or if configured
  if (isLoading || isConfigured) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing API Credentials</AlertTitle>
      <AlertDescription>
        Please configure your Nextsms and OpenRouter credentials in the{" "}
        <Link href="/settings" className="font-medium underline underline-offset-4">
          Settings
        </Link>{" "}
        page to enable full functionality.
      </AlertDescription>
    </Alert>
  )
}
