"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

type Message = {
  id: string
  message: string
  status: string
  created_at: string
  contacts?: {
    name: string
    phone: string
  }
}

export default function RecentMessagesTable() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Sample data for the table
    const sampleMessages: Message[] = [
      {
        id: "1",
        message: "Thank you for the discount offer!",
        status: "received",
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        contacts: {
          name: "John Doe",
          phone: "255712345678",
        },
      },
      {
        id: "2",
        message: "When will the new products be available?",
        status: "received",
        created_at: new Date(Date.now() - 30 * 60000).toISOString(),
        contacts: {
          name: "Jane Smith",
          phone: "255723456789",
        },
      },
      {
        id: "3",
        message: "Your order #12345 has been shipped and will arrive tomorrow.",
        status: "sent",
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        contacts: {
          name: "Michael Johnson",
          phone: "255734567890",
        },
      },
      {
        id: "4",
        message: "Don't miss our weekend sale! 20% off all items.",
        status: "sent",
        created_at: new Date(Date.now() - 120 * 60000).toISOString(),
        contacts: {
          name: "Sarah Williams",
          phone: "255745678901",
        },
      },
    ]

    // Simulate loading with a timeout
    const timer = setTimeout(() => {
      setMessages(sampleMessages)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>
  }

  if (messages.length === 0) {
    return <div className="py-4 text-center text-gray-500">No recent messages found.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contact</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((message) => (
          <TableRow key={message.id}>
            <TableCell className="font-medium">
              <div>{message.contacts?.name || "Unknown"}</div>
              <div className="text-xs text-gray-500">{message.contacts?.phone || "No phone"}</div>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{message.message}</TableCell>
            <TableCell>
              <Badge variant={message.status === "received" ? "outline" : "default"}>
                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
