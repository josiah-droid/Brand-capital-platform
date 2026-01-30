"use client"

import { TaskList } from "@/components/tasks/task-list"

export default function TasksPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-muted-foreground">
          Manage your tasks and deal-related work items
        </p>
      </div>

      {/* Task List - Full CRUD with status toggle */}
      <TaskList showDealColumn={true} />
    </div>
  )
}
