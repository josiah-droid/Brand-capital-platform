"use client"

import { useState } from "react"
import { useTimeLogs, useDeleteTimeLog, useWeeklyTimeSummary } from "@/hooks/use-time-logs"
import { formatDate, formatHours } from "@/lib/utils"
import { Clock, Trash2, Loader2 } from "lucide-react"
import { CreateTimeLogModal } from "./create-time-log-modal"

interface TimeLogListProps {
  dealId?: string
  showSummary?: boolean
}

export function TimeLogList({ dealId, showSummary = true }: TimeLogListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: timeLogs, isLoading } = useTimeLogs(dealId ? { deal_id: dealId } : undefined)
  const { data: weeklySummary } = useWeeklyTimeSummary()
  const deleteTimeLog = useDeleteTimeLog()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Weekly Summary */}
      {showSummary && weeklySummary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              This Week
            </div>
            <p className="text-2xl font-bold">{formatHours(weeklySummary.total)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Billable</p>
            <p className="text-2xl font-bold text-green-600">{formatHours(weeklySummary.billable)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Non-Billable</p>
            <p className="text-2xl font-bold text-gray-600">{formatHours(weeklySummary.nonBillable)}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Time Entries</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
        >
          + Log Time
        </button>
      </div>

      {/* Time Log List */}
      {timeLogs && timeLogs.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                {!dealId && <th className="px-4 py-3 font-medium">Deal</th>}
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Hours</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {timeLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(log.date)}</td>
                  <td className="px-4 py-3 text-sm">{log.description}</td>
                  {!dealId && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.deal?.name || "-"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.log_type === "billable"
                          ? "bg-green-100 text-green-700"
                          : log.log_type === "internal"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {log.log_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatHours(log.hours)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("Delete this time entry?")) {
                          deleteTimeLog.mutate(log.id)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-white border rounded-lg">
          No time entries yet. Click &quot;+ Log Time&quot; to add one.
        </div>
      )}

      {/* Create Modal */}
      <CreateTimeLogModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultDealId={dealId}
      />
    </div>
  )
}
