"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Settings,
  Users,
  LogOut,
  Palette,
} from "lucide-react"

interface SidebarProps {
  role: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const isClient = role === "CLIENT"
  const isAdmin = role === "ADMIN"

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Projects", href: "/projects", icon: FolderKanban, show: true },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, show: !isClient },
    { name: "Messages", href: "/messages", icon: MessageSquare, show: true },
    { name: "Team", href: "/admin/team", icon: Users, show: isAdmin },
    { name: "White-Label", href: "/admin/white-label", icon: Palette, show: isAdmin },
    { name: "Settings", href: "/settings", icon: Settings, show: true },
  ]

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Agency Portal</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          if (!item.show) return null

          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
