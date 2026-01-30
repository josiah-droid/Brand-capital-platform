"use client"

import { useDealActivities } from "@/hooks/use-activities"
import { formatDate, formatHours } from "@/lib/utils"
import {
  Loader2,
  ArrowRight,
  StickyNote,
  CheckSquare,
  Clock,
  Plus,
  Edit,
  User,
  Activity
} from "lucide-react"

interface ActivityTimelineProps {
  dealId: string
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  stage_changed: ArrowRight,
  note_added: StickyNote,
  task_created: CheckSquare,
  time_logged: Clock,
  deal_created: Plus,
  deal_updated: Edit,
}

const activityColors: Record<string, string> = {
  stage_changed: "bg-blue-100 text-blue-600",
  note_added: "bg-amber-100 text-amber-600",
  task_created: "bg-purple-100 text-purple-600",
  time_logged: "bg-green-100 text-green-600",
  deal_created: "bg-emerald-100 text-emerald-600",
  deal_updated: "bg-gray-100 text-gray-600",
}

function getActivityDescription(action: string, details?: Record<string, unknown> | null): string {
  switch (action) {
    case "stage_changed":
      return `moved project from ${details?.from || "unknown"} to ${details?.to || "unknown"}`
    case "note_added":
      return "added a note"
    case "task_created":
      return `created task "${details?.task || ""}"`
    case "time_logged":
      return `logged ${formatHours(details?.hours as number || 0)}`
    case "deal_created":
      return "created this project"
    case "deal_updated":
      const fields = (details?.fields as string[]) || []
      return fields.length > 0
        ? `updated ${fields.join(", ")}`
        : "updated project details"
    default:
      return action.replace(/_/g, " ")
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

export function ActivityTimeline({ dealId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useDealActivities(dealId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Activity items */}
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.action] || Activity
            const colorClass = activityColors[activity.action] || "bg-gray-100 text-gray-600"

            return (
              <div key={activity.id} className="relative flex gap-3 pl-1">
                {/* Icon */}
                <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {activity.user?.full_name || "System"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getActivityDescription(activity.action, activity.details as Record<string, unknown>)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
