"use client"

import { Badge } from "@/components/ui/badge"
import type { Message } from "@/lib/message-service"
import { formatDistanceToNow } from "date-fns"

interface RecentMessagesTableProps {
  messages: Message[]
}

export function RecentMessagesTable({ messages }: RecentMessagesTableProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No recent messages</div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-4 rounded-lg border p-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{message.contact?.name || "Unknown"}</p>
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
                  className="ml-auto"
                >
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{message.contact?.phone || "Unknown number"}</p>
              <p className="text-sm">{message.message}</p>
            </div>
            <div className="text-xs text-gray-500">
              {message.sent_at
                ? formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })
                : formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
