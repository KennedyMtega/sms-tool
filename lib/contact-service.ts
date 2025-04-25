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

export async function getContacts(): Promise<Contact[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching contacts:", error)
      // Throw the error or return an empty array depending on desired behavior
      // Returning empty array to avoid breaking UI expecting an array
      return []
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

    return contactsWithTags // Return the fetched data (might be empty)
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    // Throw the error or return an empty array
    return []
  }
}

// Helper function to find a contact by phone number
export async function getContactByPhone(phone: string): Promise<Contact | null> {
  try {
    const supabase = getSupabaseClient()
    // Normalize phone number for query if necessary, assuming it's already in E.164 format here
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("phone", phone)
      .maybeSingle() // Use maybeSingle to return null instead of error if not found

    if (error) {
      console.error("Error fetching contact by phone:", error)
      return null
    }
    // Note: Tags are not fetched here for simplicity, add if needed
    return data ? { ...data, tags: [] } : null
  } catch (error) {
    console.error("Failed to fetch contact by phone:", error)
    return null
  }
}

export async function getContact(id: string): Promise<Contact | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching contact:", error)
      // If the error is specifically 'PGRST116', it means no rows found, which is expected.
      // Otherwise, re-throw or handle differently. For now, return null for any error.
      return null
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
    // Return null if fetching fails
    return null
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
      // Throw the error to be handled by the caller
      throw error
    }

    // Assuming tags are handled separately or not needed immediately after creation
    return { ...data, tags: [] } // Return the created contact (tags might be added later)
  } catch (error) {
    console.error("Failed to create contact:", error)
    // Throw the error to be handled by the caller
    throw error
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
      // Throw the error to be handled by the caller
      throw error
    }

    // Note: Supabase `update` with `.single()` might return null if the row doesn't exist.
    // The caller should handle the case where `data` might be null.
    // Also, fetching tags after update might be needed if tags can be updated.
    return data
  } catch (error) {
    console.error("Failed to update contact:", error)
    // Throw the error to be handled by the caller
    throw error
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
