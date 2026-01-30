"use client"

import { useState } from "react"
import { useTasks, useToggleTaskStatus, useDeleteTask } from "@/hooks/use-tasks"
import { formatDate, getPriorityColor } from "@/lib/utils"
import { Check, Trash2, Loader2 } from "lucide-react"
import { CreateTaskModal } from "./create-task-modal"

interface TaskListProps {
  dealId?: string
  showDealColumn?: boolean
}

export function TaskList({ dealId, showDealColumn = true }: TaskListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: tasks, isLoading } = useTasks(dealId ? { deal_id: dealId } : undefined)
  const toggleStatus = useToggleTaskStatus()
  const deleteTask = useDeleteTask()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  const pendingTasks = tasks?.filter((t) => t.status !== "completed") || []
  const completedTasks = tasks?.filter((t) => t.status === "completed") || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Tasks ({pendingTasks.length} pending, {completedTasks.length} done)
        </h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
        >
          + Add Task
        </button>
      </div>

      {/* Task List */}
      {tasks && tasks.length > 0 ? (
        <div className="space-y-2">
          {/* Pending Tasks */}
          {pendingTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              showDeal={showDealColumn}
              onToggle={() => toggleStatus.mutate({ id: task.id, currentStatus: task.status })}
              onDelete={() => {
                if (confirm("Delete this task?")) {
                  deleteTask.mutate(task.id)
                }
              }}
              isToggling={toggleStatus.isPending}
            />
          ))}

          {/* Completed Tasks (collapsible) */}
          {completedTasks.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                {completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-2 opacity-60">
                {completedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDeal={showDealColumn}
                    onToggle={() => toggleStatus.mutate({ id: task.id, currentStatus: task.status })}
                    onDelete={() => {
                      if (confirm("Delete this task?")) {
                        deleteTask.mutate(task.id)
                      }
                    }}
                    isToggling={toggleStatus.isPending}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No tasks yet. Click &quot;+ Add Task&quot; to create one.
        </div>
      )}

      {/* Create Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultDealId={dealId}
      />
    </div>
  )
}

interface TaskRowProps {
  task: any
  showDeal: boolean
  onToggle: () => void
  onDelete: () => void
  isToggling: boolean
}

function TaskRow({ task, showDeal, onToggle, onDelete, isToggling }: TaskRowProps) {
  const isCompleted = task.status === "completed"

  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      {/* Status Toggle */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isCompleted
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-primary"
        }`}
        title={isCompleted ? "Mark as pending" : "Mark as done"}
      >
        {isCompleted && <Check className="w-3 h-3" />}
      </button>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {showDeal && task.deal && (
            <span>{task.deal.name}</span>
          )}
          {task.assignee && (
            <span>→ {task.assignee.full_name}</span>
          )}
        </div>
      </div>

      {/* Priority Badge */}
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}
      >
        {task.priority}
      </span>

      {/* Due Date */}
      <div className="text-xs text-muted-foreground w-20 text-right">
        {task.due_date ? formatDate(task.due_date) : "-"}
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
