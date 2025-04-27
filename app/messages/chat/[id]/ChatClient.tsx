"use client"

import { useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MessagesTableSkeleton from "@/components/skeletons/messages-table-skeleton"
import type { Message } from "@/lib/types"
import { Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"

export default function ChatClient({ initialMessages, recipient, params }: { initialMessages: Message[], recipient: { name: string, phone: string }, params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient.phone,
          message: input.trim(),
          metadata: { contactId: params.id }
        })
      })
      if (!response.ok) {
        // Optionally show error toast
        setSending(false)
        return
      }
      // Optimistically add the message to the chat
      setMessages([
        ...messages,
        {
          id: Math.random().toString(36).slice(2),
          contact_id: params.id,
          campaign_id: null,
          message: input.trim(),
          status: "sent",
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          contact: { id: params.id, name: recipient.name, phone: recipient.phone, email: null, last_contacted: null, created_at: "", updated_at: "" }
        }
      ])
      setInput("")
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const handleEnhanceWithAI = async () => {
    if (!input.trim()) return
    setAiLoading(true)
    // TODO: Call AI API to enhance message
    setTimeout(() => {
      setInput(input + " (AI-enhanced example)")
      setAiLoading(false)
    }, 1200)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setMessages(messages.filter(m => m.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto py-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <div>
          <h1 className="text-2xl font-bold">{recipient.name}</h1>
          <p className="text-muted-foreground text-sm">{recipient.phone}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/messages">Back</Link>
        </Button>
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Chat History</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-2 py-4 bg-gray-50">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm text-sm whitespace-pre-line ${message.status === "received" ? "self-start bg-white border" : "self-end bg-primary text-white"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      message.status === "delivered"
                        ? "default"
                        : message.status === "sent"
                        ? "outline"
                        : message.status === "received"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {message.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-2"
                    onClick={() => handleDelete(message.id)}
                    disabled={deletingId === message.id}
                    title="Delete message"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div>{message.message}</div>
              </div>
            ))}
          </div>
        </CardContent>
        {/* Sticky message input */}
        <div className="border-t bg-white px-4 py-3 flex gap-2 items-center sticky bottom-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !sending) handleSend() }}
            disabled={sending || aiLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEnhanceWithAI}
            disabled={aiLoading || !input.trim()}
            title="Enhance with AI"
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </Button>
          <Button onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </Card>
    </div>
  )
} 