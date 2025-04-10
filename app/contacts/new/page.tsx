"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createContact } from "@/lib/contact-service"
import { Loader2 } from "lucide-react"

export default function NewContactPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter a name for the contact.",
        variant: "destructive",
      })
      return
    }

    if (!phone) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number for the contact.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      // Create contact
      await createContact({
        name,
        phone,
        email: email || null,
        last_contacted: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      toast({
        title: "Contact created",
        description: "The contact has been created successfully.",
      })

      // Redirect to contacts page
      router.push("/contacts")
    } catch (error) {
      console.error("Failed to create contact:", error)
      toast({
        title: "Failed to create contact",
        description: "An error occurred while creating the contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add New Contact</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Enter the details for the new contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="255712345678"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500">Enter the phone number with country code (e.g., 255712345678)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/contacts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Contact"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
