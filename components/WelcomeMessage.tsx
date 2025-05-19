interface WelcomeMessageProps {
  businessName: string
}

export function WelcomeMessage({ businessName }: WelcomeMessageProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold">Welcome to {businessName} SMS Dashboard</h1>
      <p className="text-gray-500">Manage your SMS marketing campaigns, contacts, and messages</p>
    </div>
  )
} 