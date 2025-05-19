export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          name: string
          status: "draft" | "scheduled" | "active" | "completed" | "paused"
          sender_id: string
          message: string
          scheduled_date: string | null
          created_at: string
          updated_at: string
          sent_count: number
          delivered_count: number
          response_count: number
        }
        Insert: {
          id?: string
          name: string
          status: "draft" | "scheduled" | "active" | "completed" | "paused"
          sender_id: string
          message: string
          scheduled_date?: string | null
          created_at?: string
          updated_at?: string
          sent_count?: number
          delivered_count?: number
          response_count?: number
        }
        Update: {
          id?: string
          name?: string
          status?: "draft" | "scheduled" | "active" | "completed" | "paused"
          sender_id?: string
          message?: string
          scheduled_date?: string | null
          created_at?: string
          updated_at?: string
          sent_count?: number
          delivered_count?: number
          response_count?: number
        }
      }
      contacts: {
        Row: {
          id: string
          name: string
          firstName: string | null
          lastName: string | null
          phone: string
          email: string | null
          last_contacted: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          firstName?: string | null
          lastName?: string | null
          phone: string
          email?: string | null
          last_contacted?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          firstName?: string | null
          lastName?: string | null
          phone?: string
          email?: string | null
          last_contacted?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          contact_id: string | null
          campaign_id: string | null
          message: string
          status: "sent" | "delivered" | "failed" | "received"
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id?: string | null
          campaign_id?: string | null
          message: string
          status: "sent" | "delivered" | "failed" | "received"
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string | null
          campaign_id?: string | null
          message?: string
          status?: "sent" | "delivered" | "failed" | "received"
          sent_at?: string | null
          created_at?: string
        }
      }
      campaign_contacts: {
        Row: {
          campaign_id: string
          contact_id: string
          status: "pending" | "sent" | "delivered" | "failed"
          sent_at: string | null
          delivered_at: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          status?: "pending" | "sent" | "delivered" | "failed"
          sent_at?: string | null
          delivered_at?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          status?: "pending" | "sent" | "delivered" | "failed"
          sent_at?: string | null
          delivered_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
