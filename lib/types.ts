export interface Contact {
  id: string
  name: string | null
  phone: string
  email: string | null
  last_contacted: string | null
  created_at: string
  updated_at: string
  tags?: { id: string; name: string }[]
}

export interface Message {
  id: string
  contact_id: string
  campaign_id: string | null
  message: string
  status: "sent" | "delivered" | "failed" | "received"
  sent_at: string | null
  created_at: string
  contact?: Contact
} 