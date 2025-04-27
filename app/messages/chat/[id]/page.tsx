import { Suspense } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMessages } from "@/lib/message-service"
import MessagesTableSkeleton from "@/components/skeletons/messages-table-skeleton"
import type { Message } from "@/lib/types"
import { Sparkles } from "lucide-react"
import ChatClient from "./ChatClient"

export const dynamic = "force-dynamic"

export default async function ChatPage({ params }: { params: { id: string } }) {
  const allMessages = await getMessages()
  // Filter messages for this recipient
  const recipientMessages: Message[] = allMessages.filter(message => 
    message.contact?.id === params.id || message.contact_id === params.id
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

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
    phone: recipientMessages[0].contact?.phone || recipientMessages[0].contact_id
  }

  return <ChatClient initialMessages={recipientMessages} recipient={recipient} params={params} />
} 