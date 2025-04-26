"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import MessagesTableSkeleton from "@/components/skeletons/messages-table-skeleton"

interface Conversation {
  recipientId: string
  recipientName: string
  recipientPhone: string
  lastMessage: string
  lastStatus: string
  lastTimestamp: string
  unreadCount: number
}

export default function MessagesClient({ conversations }: { conversations: Conversation[] }) {
  const [search, setSearch] = useState("")
  const filtered = conversations.filter(conv =>
    (typeof conv.recipientName === 'string' ? conv.recipientName : '').toLowerCase().includes(search.toLowerCase()) ||
    (typeof conv.recipientPhone === 'string' ? conv.recipientPhone : '').includes(search)
  )

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chats</h1>
        <Button asChild>
          <Link href="/messages/new">New Message</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Search chats..." className="max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No conversations yet. Start a new message!</div>
            ) : (
              filtered.map((conv) => (
                <Link
                  key={conv.recipientId || conv.recipientPhone || conv.lastTimestamp}
                  href={`/messages/chat/${conv.recipientId}`}
                  className="flex items-center gap-4 py-4 hover:bg-accent px-2 rounded transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{conv.recipientName}</span>
                      <span className="text-xs text-muted-foreground"><RelativeTime date={conv.lastTimestamp} /></span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">{conv.lastMessage}</div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span key={"unread-" + conv.recipientId} className="ml-2 bg-primary text-white rounded-full px-2 py-0.5 text-xs">{conv.unreadCount}</span>
                  )}
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RelativeTime({ date }: { date: string }) {
  const [relative, setRelative] = useState("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("date-fns").then(({ formatDistanceToNow }) => {
        setRelative(formatDistanceToNow(new Date(date), { addSuffix: true }))
      })
    }
    const interval = setInterval(() => {
      import("date-fns").then(({ formatDistanceToNow }) => {
        setRelative(formatDistanceToNow(new Date(date), { addSuffix: true }))
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [date])
  return <>{relative}</>
} 