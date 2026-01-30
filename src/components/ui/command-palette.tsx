"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useGlobalSearch, SearchResult } from "@/hooks/use-search"
import {
  Search,
  X,
  Briefcase,
  CheckSquare,
  Clock,
  ArrowRight,
  Command,
  Loader2
} from "lucide-react"

const typeIcons: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  deal: Briefcase,
  task: CheckSquare,
  time_log: Clock,
}

const typeLabels: Record<SearchResult["type"], string> = {
  deal: "Project",
  task: "Task",
  time_log: "Time Log",
}

const typeColors: Record<SearchResult["type"], string> = {
  deal: "text-blue-600 bg-blue-100",
  task: "text-purple-600 bg-purple-100",
  time_log: "text-green-600 bg-green-100",
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { data: results, isLoading } = useGlobalSearch(query, isOpen)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10)
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        onClose()
        break
    }
  }, [results, selectedIndex, onClose])

  const handleSelect = (result: SearchResult) => {
    onClose()

    switch (result.type) {
      case "deal":
        router.push(`/deals?selected=${result.id}`)
        break
      case "task":
        router.push(`/tasks?selected=${result.id}`)
        break
      case "time_log":
        router.push(`/time?selected=${result.id}`)
        break
    }
  }

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, team members..."
            className="flex-1 outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded px-1.5 py-0.5">
            <span>esc</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && query.length >= 2 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && query.length >= 2 && results && results.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex ? "bg-primary/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-1.5 rounded ${typeColors[result.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-gray-100 rounded">
                      {typeLabels[result.type]}
                    </span>
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {query.length < 2 && (
            <div className="py-8 px-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Quick actions
              </p>
              <div className="space-y-1">
                <QuickAction
                  icon={Briefcase}
                  label="Go to Projects"
                  shortcut="G P"
                  onClick={() => {
                    onClose()
                    router.push("/deals")
                  }}
                />
                <QuickAction
                  icon={CheckSquare}
                  label="Go to Tasks"
                  shortcut="G T"
                  onClick={() => {
                    onClose()
                    router.push("/tasks")
                  }}
                />
                <QuickAction
                  icon={Clock}
                  label="Log Time"
                  shortcut="G L"
                  onClick={() => {
                    onClose()
                    router.push("/time")
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K to open</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">{shortcut}</span>
    </button>
  )
}

// Hook to manage command palette state globally
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }
}
