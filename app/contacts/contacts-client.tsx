"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Upload, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Contact } from "@/lib/contact-service"
import { getContacts } from "@/lib/contact-service"

// Sample data to use when no contacts are available
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

interface ContactsClientProps {
  initialContacts: Contact[]
}

export default function ContactsClient({ initialContacts }: ContactsClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts.length > 0 ? initialContacts : SAMPLE_CONTACTS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState("all")

  // Refresh contacts data
  useEffect(() => {
    const refreshContacts = async () => {
      if (initialContacts.length === 0) {
        try {
          setLoading(true)
          const freshContacts = await getContacts()
          if (freshContacts.length > 0) {
            setContacts(freshContacts)
          }
        } catch (error) {
          console.error("Error refreshing contacts:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    refreshContacts()
  }, [initialContacts])

  // Filter contacts based on search term and tag filter
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTag = tagFilter === "all" || (contact.tags && contact.tags.some((tag) => tag.name === tagFilter))

    return matchesSearch && matchesTag
  })

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
              <Plus className="mr-2 h-4 w-4" /> Add Contact
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
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search contacts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="all">All Tags</option>
              <option value="customer">Customer</option>
              <option value="prospect">Prospect</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <Table>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <Link href={`/contacts/${contact.id}`} className="hover:underline">
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags &&
                          contact.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline">
                              {tag.name}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/messages/new?contact=${contact.id}`}>Message</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
