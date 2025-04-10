"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<string>("")

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error("Caught error:", event.error)
      setError(event.error)
      setErrorInfo(event.error?.stack || "No stack trace available")
      setHasError(true)
      event.preventDefault()
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("Caught promise rejection:", event.reason)
      const errorObj = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      setError(errorObj)
      setErrorInfo(errorObj.stack || "No stack trace available")
      setHasError(true)
      event.preventDefault()
    }

    // Add more comprehensive error catching
    const consoleErrorOriginal = console.error
    console.error = (...args) => {
      // Check if this is a React error
      const errorText = args.join(" ")
      if (errorText.includes("React") && errorText.includes("error") && !hasError) {
        setError(new Error("React rendering error"))
        setErrorInfo(errorText)
        setHasError(true)
      }
      consoleErrorOriginal(...args)
    }

    window.addEventListener("error", errorHandler)
    window.addEventListener("unhandledrejection", rejectionHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("unhandledrejection", rejectionHandler)
      console.error = consoleErrorOriginal
    }
  }, [hasError])

  if (hasError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>An error occurred while loading this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error?.message || "An unexpected error occurred"}
            </div>
            {process.env.NODE_ENV === "development" && errorInfo && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-gray-500">Error details</summary>
                <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-gray-100 p-2 text-xs">{errorInfo}</pre>
              </details>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go to Dashboard
            </Button>
            <Button
              onClick={() => {
                setHasError(false)
                setError(null)
                setErrorInfo("")
                window.location.reload()
              }}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
