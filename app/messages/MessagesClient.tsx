"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Message } from "@/lib/types"

export default function MessagesClient({ initialConversations }: { initialConversations: any[] }) {
  const [conversations, setConversations] = useState<any[]>(initialConversations)
  const [search, setSearch] = useState("")

  const filtered = conversations.filter(conv => {
    const name = conv.contact?.name || ""
    const phone = conv.contact?.phone || conv.contact_id || ""
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search)
  })

  return (
    <div className="w-screen min-h-screen bg-gray-50 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-5xl flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Chats</h1>
        <Button asChild size="lg">
          <Link href="/messages/new">New Message</Link>
        </Button>
      </div>
      <div className="w-full max-w-5xl flex-1 flex flex-col">
        <Card className="w-full flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="mb-6 flex items-center gap-2">
              <Input placeholder="Search chats..." className="max-w-md" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-col gap-4 w-full">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No conversations yet. Start a new message!</div>
              ) : (
                filtered.map((conv) => (
                  <Link
                    key={conv.contact_id || conv.created_at}
                    href={`/messages/chat/${conv.contact_id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-lg transition border p-5 w-full"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-semibold truncate">{conv.contact_name || "No Name"}</span>
                      <span className="text-sm text-gray-500 truncate">{conv.contact_phone || ""}</span>
                      <span className="text-base text-gray-700 truncate mt-2">{conv.message}</span>
                    </div>
                    <div className="flex justify-end mt-4">
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(conv.created_at)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatRelativeTime(date: string) {
  if (!date) return ""
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`
} 