"use client"

import { useState, useEffect } from "react"
import { useTasks, useToggleTaskStatus } from "@/hooks/use-tasks"
import { useCreateTimeLog } from "@/hooks/use-time-logs"
import { createClient } from "@/lib/supabase/client"
import { formatDate, getPriorityColor } from "@/lib/utils"
import { Check, Clock, Loader2, Play, CheckCircle2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"

export default function MyWorkPage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [quickLogTask, setQuickLogTask] = useState<any>(null)

    // Get current user
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        fetchUser()
    }, [])

    const { data: tasks, isLoading } = useTasks(userId ? { assignee_id: userId } : undefined)
    const toggleStatus = useToggleTaskStatus()

    if (!userId || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Group tasks by phase
    const tasksByPhase = (tasks || []).reduce((acc: Record<string, any[]>, task: any) => {
        const phase = task.phase || "General"
        if (!acc[phase]) acc[phase] = []
        acc[phase].push(task)
        return acc
    }, {})

    const pendingTasks = (tasks || []).filter((t: any) => t.status !== "completed")
    const completedTasks = (tasks || []).filter((t: any) => t.status === "completed")

    // Phase order
    const phaseOrder = ["Strategy", "Creative", "Production", "Revisions", "Admin", "General"]
    const sortedPhases = Object.keys(tasksByPhase).sort((a, b) => {
        return phaseOrder.indexOf(a) - phaseOrder.indexOf(b)
    })

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold">My Work</h1>
                <p className="text-muted-foreground">
                    {pendingTasks.length} tasks to do • {completedTasks.length} completed
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    label="Due Today"
                    value={pendingTasks.filter((t: any) => {
                        if (!t.due_date) return false
                        const today = new Date().toISOString().split("T")[0]
                        return t.due_date === today
                    }).length}
                    color="bg-amber-50 text-amber-700"
                />
                <StatCard
                    label="Overdue"
                    value={pendingTasks.filter((t: any) => {
                        if (!t.due_date) return false
                        return new Date(t.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                    }).length}
                    color="bg-red-50 text-red-700"
                />
                <StatCard
                    label="This Week"
                    value={pendingTasks.filter((t: any) => {
                        if (!t.due_date) return false
                        const weekFromNow = new Date()
                        weekFromNow.setDate(weekFromNow.getDate() + 7)
                        return new Date(t.due_date) <= weekFromNow
                    }).length}
                    color="bg-blue-50 text-blue-700"
                />
            </div>

            {/* Tasks by Phase */}
            {pendingTasks.length > 0 ? (
                <div className="space-y-6">
                    {sortedPhases.map(phase => {
                        const phaseTasks = tasksByPhase[phase].filter((t: any) => t.status !== "completed")
                        if (phaseTasks.length === 0) return null

                        return (
                            <div key={phase} className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    {phase} ({phaseTasks.length})
                                </h3>
                                <div className="space-y-2">
                                    {phaseTasks.map((task: any) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onToggle={() => toggleStatus.mutate({ id: task.id, currentStatus: task.status })}
                                            onLogTime={() => setQuickLogTask(task)}
                                            isToggling={toggleStatus.isPending}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">You have no pending tasks.</p>
                </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <details className="mt-6">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        {completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}
                    </summary>
                    <div className="mt-3 space-y-2 opacity-60">
                        {completedTasks.map((task: any) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={() => toggleStatus.mutate({ id: task.id, currentStatus: task.status })}
                                onLogTime={() => setQuickLogTask(task)}
                                isToggling={toggleStatus.isPending}
                            />
                        ))}
                    </div>
                </details>
            )}

            {/* Quick Log Modal */}
            <QuickLogModal
                task={quickLogTask}
                onClose={() => setQuickLogTask(null)}
            />
        </div>
    )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`p-4 rounded-lg ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm">{label}</p>
        </div>
    )
}

function TaskCard({ task, onToggle, onLogTime, isToggling }: {
    task: any;
    onToggle: () => void;
    onLogTime: () => void;
    isToggling: boolean
}) {
    const isCompleted = task.status === "completed"
    const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0)) && !isCompleted

    return (
        <div className={`flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}>
            {/* Status Toggle */}
            <button
                onClick={onToggle}
                disabled={isToggling}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-primary"
                    }`}
                title={isCompleted ? "Mark as pending" : "Mark as done"}
            >
                {isCompleted && <Check className="w-4 h-4" />}
            </button>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
                <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {task.deal && (
                        <span className="truncate">{task.deal.name}</span>
                    )}
                    {task.estimated_hours && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimated_hours}h est.
                        </span>
                    )}
                </div>
            </div>

            {/* Priority */}
            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                {task.priority}
            </span>

            {/* Due Date */}
            <div className={`text-sm w-24 text-right ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                {task.due_date ? formatDate(task.due_date) : "-"}
            </div>

            {/* Quick Log Button */}
            {!isCompleted && (
                <button
                    onClick={onLogTime}
                    className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 flex items-center gap-1"
                >
                    <Play className="w-3 h-3" />
                    Log
                </button>
            )}
        </div>
    )
}

function QuickLogModal({ task, onClose }: { task: any; onClose: () => void }) {
    const [hours, setHours] = useState("0.5")
    const [description, setDescription] = useState("")
    const createTimeLog = useCreateTimeLog()

    useEffect(() => {
        if (task) {
            setDescription(task.title)
            setHours("0.5")
        }
    }, [task])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!task) return

        await createTimeLog.mutateAsync({
            task_id: task.id,
            deal_id: task.deal_id,
            hours: parseFloat(hours),
            description,
            date: new Date().toISOString().split("T")[0],
            log_type: "billable",
        })

        onClose()
    }

    if (!task) return null

    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Log Time: ${task.title}`} className="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Hours</label>
                    <div className="flex gap-2">
                        {["0.25", "0.5", "1", "2", "4"].map(h => (
                            <button
                                key={h}
                                type="button"
                                onClick={() => setHours(h)}
                                className={`px-3 py-2 rounded-md text-sm border ${hours === h ? "bg-primary text-white border-primary" : "hover:bg-gray-50"}`}
                            >
                                {h}h
                            </button>
                        ))}
                    </div>
                    <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
                        placeholder="Custom hours"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">What did you work on?</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        rows={2}
                        placeholder="Brief description..."
                        required
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createTimeLog.isPending}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        {createTimeLog.isPending ? "Logging..." : "Log Time"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
