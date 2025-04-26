import { createClient } from "@/lib/supabase/server"
import { Contact } from "./types"
export type { Contact }

export async function getContacts(): Promise<Contact[]> {
  const supabase = createClient()

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching contacts:", error)
    return []
  }

  return contacts || []
}

export async function getContact(id: string): Promise<Contact | null> {
  const supabase = createClient()

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching contact:", error)
    return null
  }

  return contact
}

export async function createContact(contact: Omit<Contact, "id">): Promise<Contact | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("contacts")
    .insert(contact)
    .select()
    .single()

  if (error) {
    console.error("Error creating contact:", error)
    return null
  }

  return data
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating contact:", error)
    return null
  }

  return data
}

export async function deleteContact(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting contact:", error)
    return false
  }

  return true
}
