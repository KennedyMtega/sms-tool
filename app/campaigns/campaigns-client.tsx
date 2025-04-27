"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { format, formatISO } from "date-fns"
import type { Campaign } from "@/lib/campaign-service"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getContacts } from "@/lib/contact-service"

// Sample data to use when no campaigns are available
const SAMPLE_CAMPAIGNS: Campaign[] = [
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

interface CampaignsClientProps {
  initialCampaigns: Campaign[]
}

export default function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [campaignName, setCampaignName] = useState("")
  const [senderId, setSenderId] = useState("N-SMS")
  const [message, setMessage] = useState("")
  const [scheduleType, setScheduleType] = useState("now")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiButtonRef = useRef<HTMLButtonElement>(null)

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/campaigns")
      const data = await res.json()
      setCampaigns(data)
    } catch (err) {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (showModal) {
      getContacts().then(setContacts)
    }
  }, [showModal])

  // Filter campaigns based on search term and status filter
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>Manage and monitor your SMS marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "active"
                            ? "default"
                            : campaign.status === "scheduled"
                              ? "outline"
                              : campaign.status === "completed"
                                ? "secondary"
                                : campaign.status === "paused"
                                  ? "secondary"
                                  : "destructive"
                        }
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.sent_count.toLocaleString()}</TableCell>
                    <TableCell>{campaign.delivered_count.toLocaleString()}</TableCell>
                    <TableCell>{campaign.response_count.toLocaleString()}</TableCell>
                    <TableCell>
                      {campaign.scheduled_date
                        ? format(new Date(campaign.scheduled_date), "yyyy-MM-dd HH:mm")
                        : format(new Date(campaign.created_at), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/campaigns/${campaign.id}/edit`}>Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/campaigns/${campaign.id}`}>View</Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteId(campaign.id)}>
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogTitle>Delete Campaign</DialogTitle>
          <DialogDescription>Are you sure you want to delete this campaign? This action cannot be undone.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteId) return;
              setDeleting(true);
              const res = await fetch(`/api/campaigns/${deleteId}/delete`, { method: "DELETE" });
              setDeleting(false);
              setDeleteId(null);
            }} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Campaign Modal */}
      <Dialog open={showModal} onOpenChange={(open: boolean) => setShowModal(open)}>
        <DialogContent>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>Fill in the details below to create and send a new campaign.</DialogDescription>
          <div className="space-y-4">
            <Input placeholder="Campaign Name" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
            <Input placeholder="Sender ID" value={senderId} onChange={e => setSenderId(e.target.value)} maxLength={11} />
            <div className="flex items-center justify-between">
              <label htmlFor="message" className="font-medium mb-1">Message</label>
              <Button
                ref={aiButtonRef}
                size="sm"
                variant="outline"
                disabled={aiLoading}
                onClick={async () => {
                  setAiError(null);
                  setAiLoading(true);
                  try {
                    const res = await fetch("/api/ai/generate-campaign-message", { method: "POST" });
                    if (res.ok) {
                      const { message: aiMsg } = await res.json();
                      setMessage(aiMsg);
                    } else {
                      setAiError("Failed to generate message.");
                    }
                  } catch (err) {
                    setAiError("Failed to generate message.");
                  }
                  setAiLoading(false);
                }}
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate with AI"}
              </Button>
            </div>
            {aiError && <div className="text-red-500 text-xs mb-1">{aiError}</div>}
            <textarea className="w-full border rounded p-2" rows={3} placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
            <div>
              <div className="font-medium mb-1">Audience</div>
              <div className="border rounded p-2 max-h-32 overflow-y-auto">
                <div className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === contacts.length && contacts.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedContacts(contacts.map(c => c.id))
                        } else {
                          setSelectedContacts([])
                        }
                      }}
                    />
                    <span className="ml-2 font-medium">Select All</span>
                  </label>
                </div>
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`modal-contact-${c.id}`}
                      checked={selectedContacts.includes(c.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedContacts([...selectedContacts, c.id])
                        } else {
                          setSelectedContacts(selectedContacts.filter(id => id !== c.id))
                        }
                      }}
                    />
                    <label htmlFor={`modal-contact-${c.id}`} className="ml-2 cursor-pointer">
                      {c.name} ({c.phone})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Schedule</div>
              <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="border rounded px-2 py-1">
                <option value="now">Send Now</option>
                <option value="scheduled">Schedule for Later</option>
              </select>
              {scheduleType === "scheduled" && (
                <div className="flex gap-2 mt-2">
                  <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                  <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                </div>
              )}
            </div>
            {modalError && <div className="text-red-500 text-sm">{modalError}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={modalLoading}>Cancel</Button>
            <Button onClick={async () => {
              setModalError(null);
              if (!campaignName || !senderId || !message || selectedContacts.length === 0) {
                setModalError("All fields and at least one recipient are required.");
                return;
              }
              setModalLoading(true);
              const recipients = contacts.filter(c => selectedContacts.includes(c.id));
              const scheduled_date = scheduleType === "scheduled" && scheduleDate && scheduleTime
                ? formatISO(new Date(`${scheduleDate}T${scheduleTime}`))
                : null;
              const res = await fetch("/api/campaigns/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: campaignName,
                  sender_id: senderId,
                  message,
                  recipients,
                  status: scheduleType === "now" ? "active" : "scheduled",
                  scheduled_date,
                })
              });
              if (res.ok) {
                setShowModal(false);
                setCampaignName("");
                setSenderId("N-SMS");
                setMessage("");
                setSelectedContacts([]);
                setScheduleType("now");
                setScheduleDate("");
                setScheduleTime("09:00");
                await fetchCampaigns();
              } else {
                setModalError("Failed to create campaign.");
              }
              setModalLoading(false);
            }} disabled={modalLoading}>
              {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Launch Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
