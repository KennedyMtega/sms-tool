"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Upload, Download, Loader2, X, Trash2, Pencil } from "lucide-react" // Add Loader2, X, Trash2, Pencil
import Link from "next/link"
import { getContacts, type Contact } from "@/lib/contact-service" // Import getContacts and Contact type

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedContacts = await getContacts()
        setContacts(fetchedContacts)
      } catch (err: any) {
        console.error("Failed to fetch contacts:", err)
        setError("Failed to load contacts. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [])

  // Add edit and delete handlers
  const handleEdit = (contact: Contact) => setEditingContact(contact)
  const handleDelete = (id: string) => setShowDeleteId(id)

  const saveEdit = async () => {
    if (!editingContact) return
    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${editingContact.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameRef.current?.value,
          phone: phoneRef.current?.value,
          email: emailRef.current?.value,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setContacts((prev) => prev.map((c) => c.id === editingContact.id ? { ...c, ...data.contact } : c))
        setEditingContact(null)
      } else {
        alert(data.error || "Failed to update contact")
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!showDeleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/contacts/${showDeleteId}/delete`, { method: "DELETE" })
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== showDeleteId))
        setShowDeleteId(null)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete contact")
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild>
            <Link href="/contacts/new">
              <span><Plus className="mr-2 h-4 w-4" /> Add Contact</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>Manage your contacts and their information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="search"
                placeholder="Search contacts..."
                className="w-full rounded-md border border-gray-300 pl-8 py-2 px-3 text-sm sm:text-base"
              />
            </div>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full sm:w-auto mt-2 sm:mt-0">
              <option value="all">All Tags</option>
              <option value="customer">Customer</option>
              <option value="prospect">Prospect</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="table-container overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No contacts found. Add your first contact to get started.
                  </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {/* Link to contact details page (assuming it exists or will be created) */}
                        {/* <Link href={`/contacts/${contact.id}`} className="hover:underline"> */}
                        {contact.name}
                        {/* </Link> */}
                    </TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags &&
                          contact.tags.map((tag: { id: string; name: string }) => (
                            <Badge key={tag.id} variant="outline">
                              {tag.name}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ClientDate dateString={contact.last_contacted} />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                          <Pencil className="w-4 h-4 mr-1" /> <span>Edit</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(contact.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> <span>Delete</span>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/messages/new?contact=${contact.id}`}> <span>Message</span> </Link>
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Upload contacts from .xls/.xlsx placeholder */}
          {/* TODO: Implement file upload and parsing logic here */}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2" onClick={() => setEditingContact(null)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Contact</h2>
            <div className="space-y-4">
              <input ref={nameRef} defaultValue={editingContact.name ?? ""} className="w-full border rounded px-3 py-2" placeholder="Name" />
              <input ref={phoneRef} defaultValue={editingContact.phone ?? ""} className="w-full border rounded px-3 py-2" placeholder="Phone" />
              <input ref={emailRef} defaultValue={editingContact.email ?? ""} className="w-full border rounded px-3 py-2" placeholder="Email" />
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline" onClick={() => setEditingContact(null)} disabled={saving}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button className="absolute top-2 right-2" onClick={() => setShowDeleteId(null)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Delete Contact?</h2>
            <p>Are you sure you want to delete this contact? This action cannot be undone.</p>
            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Client-only date formatting component
function ClientDate({ dateString }: { dateString: string | null }) {
  const [formatted, setFormatted] = useState<string>("")
  useEffect(() => {
    if (dateString) {
      setFormatted(new Date(dateString).toLocaleDateString())
    } else {
      setFormatted("Never")
    }
  }, [dateString])
  return <span>{formatted}</span>
}
