"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Message } from "@/lib/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MessageViewProps {
  initialMessage: Message
}

export function MessageView({ initialMessage }: MessageViewProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      setSending(true)
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: initialMessage.contact?.phone || "",
          message: message.trim(),
          metadata: {
            contactId: initialMessage.contact_id
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      toast.success("Message sent successfully")
      router.refresh()
      setMessage("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Details</h1>
          <p className="text-gray-500">
            Conversation with {initialMessage.contact?.name || "Unknown"}
          </p>
        </div>
        <Badge
          variant={
            initialMessage.status === "delivered"
              ? "default"
              : initialMessage.status === "sent"
                ? "outline"
                : initialMessage.status === "received"
                  ? "secondary"
                  : "destructive"
          }
        >
          {initialMessage.status.charAt(0).toUpperCase() + initialMessage.status.slice(1)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="font-medium">{initialMessage.contact?.name || "Unknown"}</div>
                <div className="text-sm text-gray-500">{initialMessage.contact?.phone}</div>
                <div className="mt-2">{initialMessage.message}</div>
              </div>
              <div className="text-sm text-gray-500">
                {initialMessage.sent_at
                  ? format(new Date(initialMessage.sent_at), "PPpp")
                  : format(new Date(initialMessage.created_at), "PPpp")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send New Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <textarea
                className="min-h-[100px] w-full rounded-md border border-gray-300 p-3"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
            >
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 