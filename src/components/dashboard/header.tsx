"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Menu, User, Search, Command } from "lucide-react"
import type { Profile } from "@/types/database"

interface HeaderProps {
  user: Profile | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const openSearch = () => {
    // Dispatch keyboard event to trigger command palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Mobile menu button */}
      <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-secondary">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Bar */}
      <button
        onClick={openSearch}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search projects...</span>
        <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-white border rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* User menu */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{user?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role || "associate"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
