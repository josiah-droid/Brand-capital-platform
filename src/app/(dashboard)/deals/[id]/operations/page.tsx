"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useDeal } from "@/hooks/use-deals"
import { useTasks, useUpdateTask, useCreateTask } from "@/hooks/use-tasks"
import { useDealTimeTotals } from "@/hooks/use-time-logs"
import { useUsers } from "@/hooks/use-deals"
import { formatDate, getPriorityColor, cn } from "@/lib/utils"
import {
    ArrowLeft,
    Check,
    Clock,
    Loader2,
    Plus,
    User,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    LayoutTemplate
} from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { ApplyTemplateModal } from "@/components/templates/apply-template-modal"

export default function DealOperationsPage() {
    const params = useParams()
    const dealId = params.id as string

    const { data: deal, isLoading: dealLoading } = useDeal(dealId)
    const { data: tasks, isLoading: tasksLoading } = useTasks({ deal_id: dealId })
    const { data: timeTotals } = useDealTimeTotals()
    const { data: users } = useUsers()
    const updateTask = useUpdateTask()

    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
    const [isTemplateOpen, setIsTemplateOpen] = useState(false)

    if (dealLoading || tasksLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!deal) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Deal not found</p>
                <Link href="/deals" className="text-primary hover:underline mt-2 inline-block">
                    ← Back to Projects
                </Link>
            </div>
        )
    }

    // Group tasks by phase
    const phases = ["Strategy", "Creative", "Production", "Revisions", "Admin", "General"]
    const tasksByPhase = phases.reduce((acc, phase) => {
        acc[phase] = (tasks || []).filter((t: any) => (t.phase || "General") === phase)
        return acc
    }, {} as Record<string, any[]>)

    // Calculate budget burn
    const dealTime = timeTotals?.[dealId] || { total_hours: 0, billable_hours: 0, total_cost: 0 }
    const hoursUsed = dealTime.total_hours
    const hoursBudgeted = deal.hours_budgeted || 0
    const burnPercentage = hoursBudgeted > 0 ? Math.min((hoursUsed / hoursBudgeted) * 100, 100) : 0
    const isOverBudget = hoursUsed > hoursBudgeted && hoursBudgeted > 0
    const remainingHours = Math.max(hoursBudgeted - hoursUsed, 0)

    // Calculate effective hourly rate
    const projectValue = deal.project_value || 0
    const effectiveRate = hoursUsed > 0 ? projectValue / hoursUsed : 0

    // Calculate completion stats
    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter((t: any) => t.status === "completed").length || 0
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/deals"
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{deal.name}</h1>
                    <p className="text-muted-foreground">{deal.company_name}</p>
                </div>
                <div className="flex items-center gap-2">
                    {deal.start_date && (
                        <span className="text-sm text-muted-foreground">
                            {formatDate(deal.start_date)} - {deal.end_date ? formatDate(deal.end_date) : "Ongoing"}
                        </span>
                    )}
                </div>
            </div>

            {/* Budget & Progress Cards */}
            <div className="grid grid-cols-4 gap-4">
                {/* Budget Burn */}
                <div className={cn(
                    "p-4 rounded-lg border",
                    isOverBudget ? "bg-red-50 border-red-200" : "bg-white"
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Hours Burn</span>
                        {isOverBudget && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                    <p className={cn("text-2xl font-bold", isOverBudget && "text-red-600")}>
                        {hoursUsed.toFixed(1)} / {hoursBudgeted}h
                    </p>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                burnPercentage > 100 ? "bg-red-500" :
                                    burnPercentage > 80 ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(burnPercentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {remainingHours.toFixed(1)}h remaining
                    </p>
                </div>

                {/* Effective Rate */}
                <div className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Effective Rate</span>
                    </div>
                    <p className="text-2xl font-bold">${effectiveRate.toFixed(0)}/hr</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Based on ${projectValue.toLocaleString()} value
                    </p>
                </div>

                {/* Task Progress */}
                <div className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Task Progress</span>
                    </div>
                    <p className="text-2xl font-bold">{completedTasks} / {totalTasks}</p>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Margin Status */}
                <div className={cn(
                    "p-4 rounded-lg border",
                    effectiveRate < 100 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Profit Margin</span>
                    </div>
                    <p className={cn(
                        "text-2xl font-bold",
                        effectiveRate < 100 ? "text-red-600" : "text-green-600"
                    )}>
                        {effectiveRate > 0 ? (hoursUsed > 0 ? "Healthy" : "Not Started") : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {effectiveRate > 150 ? "Above target" : effectiveRate > 100 ? "On track" : "Below target"}
                    </p>
                </div>
            </div>

            {/* Tasks by Phase */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Tasks by Phase</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsTemplateOpen(true)}
                            className="px-3 py-1.5 border border-primary text-primary rounded-md text-sm hover:bg-primary/5 flex items-center gap-1"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Use Template
                        </button>
                        <button
                            onClick={() => setIsAddTaskOpen(true)}
                            className="px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Add Task
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {phases.map(phase => {
                        const phaseTasks = tasksByPhase[phase]
                        const phaseHours = phaseTasks.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0)
                        const phaseCompleted = phaseTasks.filter((t: any) => t.status === "completed").length

                        return (
                            <div key={phase} className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium">{phase}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {phaseTasks.length} tasks • {phaseHours}h estimated
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {phaseCompleted}/{phaseTasks.length} done
                                        </span>
                                        <button
                                            onClick={() => { setSelectedPhase(phase); setIsAddTaskOpen(true); }}
                                            className="p-1 hover:bg-gray-200 rounded"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {phaseTasks.length > 0 ? (
                                    <div className="divide-y">
                                        {phaseTasks.map((task: any) => (
                                            <TaskRow
                                                key={task.id}
                                                task={task}
                                                users={users || []}
                                                onAssign={(userId) => updateTask.mutate({ id: task.id, assignee_id: userId })}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No tasks in this phase
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={isAddTaskOpen}
                onClose={() => { setIsAddTaskOpen(false); setSelectedPhase(null); }}
                dealId={dealId}
                defaultPhase={selectedPhase || "General"}
                users={users || []}
            />

            {/* Apply Template Modal */}
            <ApplyTemplateModal
                isOpen={isTemplateOpen}
                onClose={() => setIsTemplateOpen(false)}
                dealId={dealId}
                dealStartDate={deal.start_date || undefined}
            />
        </div>
    )
}

function TaskRow({ task, users, onAssign }: { task: any; users: any[]; onAssign: (userId: string) => void }) {
    const isCompleted = task.status === "completed"

    return (
        <div className={cn(
            "flex items-center gap-4 px-4 py-3 hover:bg-gray-50",
            isCompleted && "opacity-60"
        )}>
            {/* Status indicator */}
            <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                isCompleted ? "bg-green-500" :
                    task.status === "in_progress" ? "bg-blue-500" : "bg-gray-300"
            )} />

            {/* Task info */}
            <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-sm", isCompleted && "line-through")}>
                    {task.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.estimated_hours && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimated_hours}h
                        </span>
                    )}
                    {task.due_date && (
                        <span>{formatDate(task.due_date)}</span>
                    )}
                </div>
            </div>

            {/* Priority */}
            <span className={cn(
                "px-2 py-0.5 text-xs rounded font-medium capitalize",
                getPriorityColor(task.priority)
            )}>
                {task.priority}
            </span>

            {/* Assignee */}
            <select
                value={task.assignee_id || ""}
                onChange={(e) => onAssign(e.target.value)}
                className="text-sm border rounded-md px-2 py-1 min-w-[140px]"
            >
                <option value="">Unassigned</option>
                {users.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.full_name}
                    </option>
                ))}
            </select>
        </div>
    )
}

function AddTaskModal({ isOpen, onClose, dealId, defaultPhase, users }: {
    isOpen: boolean;
    onClose: () => void;
    dealId: string;
    defaultPhase: string;
    users: any[];
}) {
    const [title, setTitle] = useState("")
    const [phase, setPhase] = useState(defaultPhase)
    const [assigneeId, setAssigneeId] = useState("")
    const [estimatedHours, setEstimatedHours] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")

    const createTask = useCreateTask()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        await createTask.mutateAsync({
            title,
            deal_id: dealId,
            assignee_id: assigneeId || undefined,
            estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
            due_date: dueDate || undefined,
            priority,
        })

        // Reset form
        setTitle("")
        setPhase(defaultPhase)
        setAssigneeId("")
        setEstimatedHours("")
        setDueDate("")
        setPriority("medium")
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Task" className="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Task Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Design homepage mockup"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Phase</label>
                        <select
                            value={phase}
                            onChange={(e) => setPhase(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                            {["Strategy", "Creative", "Production", "Revisions", "Admin", "General"].map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Assign To</label>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Est. Hours</label>
                        <input
                            type="number"
                            step="0.5"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            placeholder="2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createTask.isPending}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        {createTask.isPending ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
