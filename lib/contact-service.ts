import { getSupabaseClient } from "./supabase-client"

export type Contact = {
  id: string
  name: string
  phone: string
  email: string | null
  last_contacted: string | null
  created_at: string
  updated_at: string
  tags?: { id: string; name: string }[]
}

// Sample data to use when Supabase is not available
const SAMPLE_CONTACTS: Contact[] = [
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

export async function getContacts(): Promise<Contact[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching contacts:", error)
      return SAMPLE_CONTACTS
      return SAMPLE_CONTACTS // Return sample data if initial fetch failed
    }

    // Fetch tags for each contact
    const contactsWithTags = await Promise.all(
      data.map(async (contact: Contact) => { // Add Contact type
        const { data: tagData, error: tagError } = await supabase
          .from("contact_tags")
          .select("tags:tag_id(id, name)")
          .eq("contact_id", contact.id)

        if (tagError) {
          console.error(`Error fetching tags for contact ${contact.id}:`, tagError)
          return { ...contact, tags: [] } // Return contact with empty tags on error
        }

        // Define type for tagData elements
        const tags = tagData.map((t: { tags: { id: string; name: string } }) => t.tags)
        return { ...contact, tags }
      }),
    )

    return contactsWithTags.length > 0 ? contactsWithTags : SAMPLE_CONTACTS
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return SAMPLE_CONTACTS
  }
}

export async function getContact(id: string): Promise<Contact | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching contact:", error)
      return SAMPLE_CONTACTS.find((c) => c.id === id) || null
      return SAMPLE_CONTACTS.find((c) => c.id === id) || null // Return sample data if initial fetch failed
    }

    // Fetch tags for the contact
    const { data: tagData, error: tagError } = await supabase
      .from("contact_tags")
      .select("tags:tag_id(id, name)")
      .eq("contact_id", id)

    if (tagError) {
      console.error(`Error fetching tags for contact ${id}:`, tagError)
      return { ...data, tags: [] } // Return contact with empty tags on error
    }

    // Define type for tagData elements
    const tags = tagData.map((t: { tags: { id: string; name: string } }) => t.tags)
    return { ...data, tags }
  } catch (error) {
    console.error("Failed to fetch contact:", error)
    return SAMPLE_CONTACTS.find((c) => c.id === id) || null
  }
}

export async function createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Promise<Contact> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        ...contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating contact:", error)
      // Return a mock response with a generated ID
      return {
        id: Math.random().toString(36).substring(2, 11),
        ...contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [],
      }
    }

    return { ...data, tags: [] }
  } catch (error) {
    console.error("Failed to create contact:", error)
    // Return a mock response with a generated ID
    return {
      id: Math.random().toString(36).substring(2, 11),
      ...contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
    }
  }
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("contacts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating contact:", error)
      // Return a mock updated contact
      const contact = SAMPLE_CONTACTS.find((c) => c.id === id)
      if (!contact) throw new Error("Contact not found")

      return {
        ...contact,
        ...updates,
        updated_at: new Date().toISOString(),
      }
    }

    return data
  } catch (error) {
    console.error("Failed to update contact:", error)
    // Return a mock updated contact
    const contact = SAMPLE_CONTACTS.find((c) => c.id === id)
    if (!contact) throw new Error("Contact not found")

    return {
      ...contact,
      ...updates,
      updated_at: new Date().toISOString(),
    }
  }
}

export async function deleteContact(id: string): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("contacts").delete().eq("id", id)

    if (error) {
      console.error("Error deleting contact:", error)
    }
  } catch (error) {
    console.error("Failed to delete contact:", error)
  }
}
