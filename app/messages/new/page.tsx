import { getContacts } from "@/lib/contact-service"
import { NewMessageForm } from "./new-message-form"

export default async function NewMessagePage() {
  const contacts = await getContacts()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Message</h1>
      <NewMessageForm contacts={contacts} />
    </div>
  )
}
