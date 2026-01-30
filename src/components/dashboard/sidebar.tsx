"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Settings,
  Users,
  PieChart,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"

interface SidebarProps {
  userRole: UserRole
  companyName?: string
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "partner", "associate"],
  },
  {
    name: "Projects",
    href: "/deals",
    icon: Briefcase,
    roles: ["admin", "partner", "associate"],
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["admin", "partner", "associate"],
  },
  {
    name: "Time Logs",
    href: "/time",
    icon: Clock,
    roles: ["admin", "partner", "associate"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: PieChart,
    roles: ["admin", "partner"],
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
    roles: ["admin", "partner"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
]

export function Sidebar({ userRole, companyName }: SidebarProps) {
  const pathname = usePathname()

  const filteredNav = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-white border-r lg:block">
      {/* Logo & Company */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">
            {companyName ? companyName.charAt(0).toUpperCase() : "BC"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-lg block truncate">
            {companyName || "Brandcapital"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Role indicator */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-3 py-2 bg-slate-100 rounded-md">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium capitalize">{userRole}</p>
        </div>
      </div>
    </aside>
  )
}
