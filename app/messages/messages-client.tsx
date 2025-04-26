"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Message } from "@/lib/types"

interface MessagesClientProps {
  initialMessages: Message[]
}

export default function MessagesClient({ initialMessages }: MessagesClientProps) {
  const [messages] = useState(initialMessages)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.contact?.phone?.includes(searchQuery)
    
    const matchesStatus = statusFilter === "all" || message.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Messages</CardTitle>
        <CardDescription>View and manage your SMS messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="search"
              placeholder="Search messages..."
              className="w-full rounded-md border border-gray-300 pl-8 py-2 px-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {messages.length === 0
                    ? "No messages found. Send your first message to get started."
                    : "No messages match your search criteria."}
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
  )
}
