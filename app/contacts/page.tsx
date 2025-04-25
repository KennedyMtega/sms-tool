import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
"use client" // Make this a client component

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Upload, Download, Loader2 } from "lucide-react" // Add Loader2
import Link from "next/link"
import { getContacts, type Contact } from "@/lib/contact-service" // Import getContacts and Contact type

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
              <input
                type="search"
                placeholder="Search contacts..."
                className="w-full rounded-md border border-gray-300 pl-8 py-2 px-3"
              />
            </div>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="all">All Tags</option>
              <option value="customer">Customer</option>
              <option value="prospect">Prospect</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : (
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
                        <Button variant="outline" size="sm" disabled> {/* Disable Edit for now */}
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/messages/new?contact=${contact.id}`}>Message</Link> {/* Keep Message link */}
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
