"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Contact } from "@/lib/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { X, Sparkles } from "lucide-react"

interface NewMessageFormProps {
  contacts: Contact[]
}

export function NewMessageForm({ contacts }: NewMessageFormProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [showAiPreview, setShowAiPreview] = useState(false)

  const filteredContacts = contacts.filter(
    (contact) =>
      !selectedContacts.find((c) => c.id === contact.id) &&
      (contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery))
  )

  const handleSelectContact = (contact: Contact) => {
    setSelectedContacts([...selectedContacts, contact])
    setSearchQuery("")
  }

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId))
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (selectedContacts.length === 0) {
      toast.error("Please select at least one recipient")
      return
    }

    try {
      setSending(true)
      
      // Send to each contact
      for (const contact of selectedContacts) {
        const response = await fetch("/api/sms/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: contact.phone,
            message: message.trim(),
            metadata: {
              contactId: contact.id
            }
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to send message")
        }
      }

      toast.success("Message sent successfully")
      router.push("/messages")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleEnhanceWithAI = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to enhance")
      return
    }
    setAiLoading(true)
    setShowAiPreview(false)
    // TODO: Call AI API to enhance message
    setTimeout(() => {
      setAiMessage(message + " (AI-enhanced example)")
      setShowAiPreview(true)
      setAiLoading(false)
    }, 1200)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Message</CardTitle>
        <CardDescription>Send an SMS to one or more recipients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients</Label>
            {selectedContacts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedContacts.map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="pl-2">
                    {contact.name || contact.phone}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={() => handleRemoveContact(contact.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && filteredContacts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md bg-white border border-gray-200 shadow-lg">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none"
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="font-medium">{contact.name || "Unknown"}</div>
                    <div className="text-sm text-gray-500">{contact.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <div className="flex gap-2 items-end">
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                disabled={aiLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-2"
                onClick={handleEnhanceWithAI}
                disabled={aiLoading || !message.trim()}
                title="Enhance with AI"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {message.length} characters ({Math.ceil(message.length / 160)} SMS)
            </div>
            {aiLoading && <div className="text-xs text-blue-500 mt-1">Enhancing message with AI...</div>}
            {showAiPreview && (
              <div className="mt-2 p-3 border rounded bg-blue-50">
                <div className="font-semibold mb-1">AI-Enhanced Suggestion:</div>
                <div className="mb-2 whitespace-pre-line">{aiMessage}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setMessage(aiMessage); setShowAiPreview(false); }}>Use This</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAiPreview(false)}>Dismiss</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/messages">Cancel</Link>
        </Button>
        <Button
          onClick={handleSendMessage}
          disabled={sending || !message.trim() || selectedContacts.length === 0}
        >
          {sending ? "Sending..." : "Send Message"}
        </Button>
      </CardFooter>
    </Card>
  )
} 