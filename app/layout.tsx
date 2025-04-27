import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
// import { Toaster } from "@/components/ui/toaster" // Use sonner Toaster
import { Toaster as SonnerToaster } from "sonner" // Import sonner Toaster
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Sidebar from "@/components/sidebar"
import { CredentialsProvider } from "@/lib/credentials-context" // Import the provider
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SMS Marketing & Support Tool",
  description: "AI-powered SMS marketing and customer support tool",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <CredentialsProvider>
            <div className="flex flex-col md:flex-row h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto p-2 md:p-6">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
            <SonnerToaster richColors position="top-right" /> {/* Use Sonner Toaster */}
          </CredentialsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
