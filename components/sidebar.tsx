"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, MessageSquare, Users, Calendar, Settings, Home, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Campaigns",
    icon: Calendar,
    href: "/campaigns",
    color: "text-violet-500",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    href: "/messages",
    color: "text-pink-700",
  },
  {
    label: "Contacts",
    icon: Users,
    href: "/contacts",
    color: "text-orange-500",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    color: "text-yellow-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMobile = useMobile()

  // Close mobile menu when navigating or resizing to desktop
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobile])

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Render mobile menu button
  const renderMobileMenuButton = () => (
    <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" onClick={toggleMobileMenu}>
      {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  )

  // Render sidebar content
  const renderSidebarContent = () => (
    <div className="space-y-1">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
            pathname === route.href ? "bg-gray-100 text-gray-900" : "text-gray-500",
          )}
        >
          <route.icon className={cn("h-5 w-5", route.color)} />
          {!isCollapsed && <span className="ml-2">{route.label}</span>}
        </Link>
      ))}
    </div>
  )

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {renderMobileMenuButton()}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
            <div
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white py-4 px-3 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 px-4">
                <h2 className="text-lg font-semibold tracking-tight">SMS Marketing Tool</h2>
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {renderSidebarContent()}
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-white py-4 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-6 px-4">
          {!isCollapsed && <h2 className="text-lg font-semibold tracking-tight">SMS Marketing Tool</h2>}
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {renderSidebarContent()}
      </div>
    </div>
  )
}
