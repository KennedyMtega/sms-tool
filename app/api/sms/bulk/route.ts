import { NextResponse } from "next/server"
import { sendBulkSMS, BulkSMSMessage } from "@/lib/nextsms-service"

export async function POST(request: Request) {
  try {
    const messages: BulkSMSMessage[] = await request.json()
    const result = await sendBulkSMS(messages)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error sending bulk SMS:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send bulk SMS" },
      { status: 500 }
    )
  }
}