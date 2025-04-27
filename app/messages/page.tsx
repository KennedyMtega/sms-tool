import { getConversations } from "@/lib/message-service"
import MessagesClient from "./MessagesClient"

export default async function MessagesPage() {
  // Initial page load: fetch first 20 conversations
  const conversations = await getConversations({ limit: 20, offset: 0 })
  return <MessagesClient initialConversations={conversations} />
}

export const dynamic = "force-dynamic"
