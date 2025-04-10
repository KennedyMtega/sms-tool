import type { Campaign } from "./campaign-service"
import type { Contact } from "./contact-service"
import type { Message } from "./message-service"

// Sample campaigns data
export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Summer Sale Announcement",
    status: "active",
    sender_id: "N-SMS",
    message:
      "Summer SALE! 🔥 Get 20% OFF all products this weekend only. Use code SUMMER20 at checkout. Limited time offer! Reply STOP to opt out.",
    scheduled_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sent_count: 1250,
    delivered_count: 1230,
    response_count: 320,
  },
  {
    id: "2",
    name: "New Product Launch",
    status: "scheduled",
    sender_id: "N-SMS",
    message:
      "Exciting news! Our new premium widget is now available. Be the first to try it out at www.example.com/new-product. Reply STOP to opt out.",
    scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sent_count: 0,
    delivered_count: 0,
    response_count: 0,
  },
]

// Sample contacts data
export const SAMPLE_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "John Doe",
    phone: "255712345678",
    email: "john.doe@example.com",
    last_contacted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [{ id: "1", name: "customer" }],
  },
  {
    id: "2",
    name: "Jane Smith",
    phone: "255723456789",
    email: "jane.smith@example.com",
    last_contacted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [{ id: "2", name: "vip" }],
  },
]

// Sample messages data
export const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    contact_id: "1",
    campaign_id: "1",
    message: "Thank you for the discount offer!",
    status: "received",
    sent_at: new Date(Date.now() - 5 * 60000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    contact: {
      name: "John Doe",
      phone: "255712345678",
    },
  },
  {
    id: "2",
    contact_id: "2",
    campaign_id: null,
    message: "When will the new products be available?",
    status: "received",
    sent_at: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    contact: {
      name: "Jane Smith",
      phone: "255723456789",
    },
  },
  {
    id: "3",
    contact_id: "1",
    campaign_id: "1",
    message: "Your order #12345 has been shipped and will arrive tomorrow.",
    status: "sent",
    sent_at: new Date(Date.now() - 60 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    contact: {
      name: "John Doe",
      phone: "255712345678",
    },
  },
]
