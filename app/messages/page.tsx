import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { SAMPLE_MESSAGES } from "@/lib/sample-data"
import { format } from "date-fns"

export default function MessagesPage() {
  // Use sample data directly to avoid any loading errors
  const messages = SAMPLE_MESSAGES

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
              <input
                type="search"
                placeholder="Search messages..."
                className="w-full rounded-md border border-gray-300 pl-8 py-2 px-3"
              />
            </div>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
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
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No messages found. Send your first message to get started.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
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
