"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Message } from "@/lib/message-service"
import { getMessages } from "@/lib/message-service"

// Sample data to use when no messages are available
const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    contact_id: "1",
    campaign_id: "1",
    message: "Thank you for the discount offer!",
    status: "received",
    sent_at: new Date(Date.now() - 5 * 60000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    contact: {
      name: "John Doe",
      phone: "255712345678",
    },
  },
  {
    id: "2",
    contact_id: "2",
    campaign_id: null,
    message: "When will the new products be available?",
    status: "received",
    sent_at: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    contact: {
      name: "Jane Smith",
      phone: "255723456789",
    },
  },
  {
    id: "3",
    contact_id: "1",
    campaign_id: "1",
    message: "Your order #12345 has been shipped and will arrive tomorrow.",
    status: "sent",
    sent_at: new Date(Date.now() - 60 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    contact: {
      name: "John Doe",
      phone: "255712345678",
    },
  },
]

interface MessagesClientProps {
  initialMessages: Message[]
}

export default function MessagesClient({ initialMessages }: MessagesClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : SAMPLE_MESSAGES)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Refresh messages data
  useEffect(() => {
    const refreshMessages = async () => {
      if (initialMessages.length === 0) {
        try {
          setLoading(true)
          const freshMessages = await getMessages()
          if (freshMessages.length > 0) {
            setMessages(freshMessages)
          }
        } catch (error) {
          console.error("Error refreshing messages:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    refreshMessages()
  }, [initialMessages])

  // Filter messages based on search term and status filter
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      message.contact?.phone?.includes(searchTerm) ||
      false ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || message.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button asChild>
          <Link href="/messages/new">
            <Plus className="mr-2 h-4 w-4" /> New Message
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Messages</CardTitle>
          <CardDescription>View and manage your SMS messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="received">Received</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No messages found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="font-medium">{message.contact?.name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{message.contact?.phone || "Unknown"}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                    <TableCell>
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
                      >
                        {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {message.sent_at
                        ? format(new Date(message.sent_at), "yyyy-MM-dd HH:mm")
                        : format(new Date(message.created_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/messages/${message.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
