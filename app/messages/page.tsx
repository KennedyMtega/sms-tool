import { getMessages } from "@/lib/message-service"
import MessagesClient from "./MessagesClient"

interface Conversation {
  recipientId: string
  recipientName: string
  recipientPhone: string
  lastMessage: string
  lastStatus: string
  lastTimestamp: string
  unreadCount: number
}

function groupConversations(messages: any[]): Conversation[] {
  const map = new Map<string, Conversation>()
  for (const msg of messages) {
    const phone = msg.contact?.phone || msg.to_number
    const id = msg.contact?.id || phone
    const name = msg.contact?.name || phone
    const key = id
    const isUnread = false // Placeholder for future unread logic
    if (!map.has(key)) {
      map.set(key, {
        recipientId: id,
        recipientName: name,
        recipientPhone: phone,
        lastMessage: msg.message,
        lastStatus: msg.status,
        lastTimestamp: msg.created_at,
        unreadCount: isUnread ? 1 : 0,
      })
    } else {
      const conv = map.get(key)!
      if (new Date(msg.created_at) > new Date(conv.lastTimestamp)) {
        conv.lastMessage = msg.message
        conv.lastStatus = msg.status
        conv.lastTimestamp = msg.created_at
      }
      if (isUnread) conv.unreadCount++
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime())
}

export default async function MessagesPage() {
  const messages = await getMessages()
  const conversations = groupConversations(messages)
  return <MessagesClient conversations={conversations} />
}

export const dynamic = "force-dynamic"
