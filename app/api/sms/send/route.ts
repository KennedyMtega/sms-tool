import { NextResponse } from 'next/server';
import { sendSMS } from "@/lib/nextsms-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, message, metadata } = body

    const result = await sendSMS({
      to,
      message,
      metadata
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error sending SMS:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send SMS" },
      { status: 500 }
    )
  }
}
