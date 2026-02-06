"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getTemplateById, TaskTemplate, TemplateTask } from "@/lib/task-templates"
import type { TaskPriority } from "@/types/database"

interface ApplyTemplateInput {
    templateId: string
    dealId: string
    startDate?: string // Optional project start date for relative scheduling
}

export function useApplyTemplate() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ templateId, dealId, startDate }: ApplyTemplateInput) => {
            const template = getTemplateById(templateId)
            if (!template) throw new Error("Template not found")

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Get user's company_id
            const { data: profile } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", user.id)
                .single()

            if (!profile?.company_id) throw new Error("No company found")

            // Calculate dates based on start date
            const baseDate = startDate ? new Date(startDate) : new Date()

            // Prepare tasks for bulk insert
            const tasksToInsert = template.tasks.map((task: TemplateTask) => {
                let dueDate: string | null = null
                if (task.relativeDay !== undefined) {
                    const taskDate = new Date(baseDate)
                    taskDate.setDate(taskDate.getDate() + task.relativeDay)
                    dueDate = taskDate.toISOString().split("T")[0]
                }

                return {
                    title: task.title,
                    description: task.description || null,
                    deal_id: dealId,
                    phase: task.phase,
                    priority: task.priority as TaskPriority,
                    estimated_hours: task.estimatedHours,
                    due_date: dueDate,
                    status: "todo" as const,
                    created_by_id: user.id,
                    company_id: profile.company_id,
                }
            })

            // Bulk insert tasks
            const { data, error } = await supabase
                .from("tasks")
                .insert(tasksToInsert)
                .select()

            if (error) throw error

            return {
                template,
                tasksCreated: data?.length || 0,
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] })
        },
    })
}
