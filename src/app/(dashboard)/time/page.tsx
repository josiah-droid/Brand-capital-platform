"use client"

import { TimeLogList } from "@/components/time/time-log-list"

export default function TimePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Time Tracking</h1>
        <p className="text-muted-foreground">
          Log and manage your time entries
        </p>
      </div>

      {/* Time Log List - Full CRUD with weekly summary */}
      <TimeLogList showSummary={true} />
    </div>
  )
}
