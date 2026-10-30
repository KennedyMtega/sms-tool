import { Suspense } from "react"
import { getMessage } from "@/lib/message-service"
import { MessageView } from "./message-view"
import { MessageViewSkeleton } from "@/components/skeletons/message-view-skeleton"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface MessagePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params
  const message = await getMessage(id)
  
  if (!message) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<MessageViewSkeleton />}>
        <MessageView initialMessage={message} />
      </Suspense>
    </div>
  )
} 