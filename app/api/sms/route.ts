import { sendSMS } from "@/lib/nextsms-api"

export async function POST(req: Request) {
  return sendSMS(req)
}
