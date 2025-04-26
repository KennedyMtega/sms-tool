import { Suspense } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMessages } from "@/lib/message-service"
import MessagesTableSkeleton from "@/components/skeletons/messages-table-skeleton"

export const dynamic = "force-dynamic"

export default async function ChatPage({ params }: { params: { id: string } }) {
  const allMessages = await getMessages()
  
  // Filter messages for this recipient
  const recipientMessages = allMessages.filter(message => 
    message.contact?.id === params.id || message.to_number === params.id
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (recipientMessages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Chat Not Found</h1>
          <Button asChild>
            <Link href="/messages">Back to Messages</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>This conversation does not exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const recipient = {
    name: recipientMessages[0].contact?.name || "Unknown",
    phone: recipientMessages[0].to_number
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{recipient.name}</h1>
          <p className="text-muted-foreground">{recipient.phone}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/messages">Back to Messages</Link>
          </Button>
          <Button asChild>
            <Link href={`/messages/new?to=${recipient.phone}`}>Send New Message</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<MessagesTableSkeleton />}>
            <div className="space-y-4">
              {recipientMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex flex-col gap-2 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
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
                      {message.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              ))}
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
} 