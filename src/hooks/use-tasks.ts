"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Task, TaskStatus, TaskPriority } from "@/types/database"

interface CreateTaskInput {
  title: string
  description?: string
  deal_id?: string
  assignee_id?: string
  priority?: TaskPriority
  due_date?: string
  estimated_hours?: number
}

interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  deal_id?: string
  assignee_id?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  estimated_hours?: number
}

export function useTasks(filters?: { deal_id?: string; assignee_id?: string; status?: TaskStatus }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          deal:deals(id, name, company_name),
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
          created_by:profiles!tasks_created_by_id_fkey(id, full_name)
        `)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })

      if (filters?.deal_id) {
        query = query.eq("deal_id", filters.deal_id)
      }
      if (filters?.assignee_id) {
        query = query.eq("assignee_id", filters.assignee_id)
      }
      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get user's company_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) throw new Error("No company found. Please complete onboarding.")

      // Validate assignee exists if provided
      if (input.assignee_id) {
        const { data: assignee, error: assigneeError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", input.assignee_id)
          .single()

        if (assigneeError || !assignee) {
          throw new Error("Assigned user does not exist")
        }
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...input,
          created_by_id: user.id,
          company_id: profile.company_id,
        })
        .select(`
          *,
          deal:deals(id, name),
          assignee:profiles!tasks_assignee_id_fkey(id, full_name)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskInput) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useToggleTaskStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: TaskStatus }) => {
      const newStatus: TaskStatus = currentStatus === "completed" ? "todo" : "completed"

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    // Optimistic update for instant feedback
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })

      const previousTasks = queryClient.getQueryData(["tasks"])

      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
        if (!old) return old
        return old.map((task: any) =>
          task.id === id
            ? { ...task, status: currentStatus === "completed" ? "todo" : "completed" }
            : task
        )
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
