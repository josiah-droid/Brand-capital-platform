"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { TimeLogType } from "@/types/database"

interface CreateTimeLogInput {
  deal_id?: string
  task_id?: string
  date: string
  hours: number
  log_type?: TimeLogType
  description: string
}

interface UpdateTimeLogInput {
  id: string
  deal_id?: string
  task_id?: string
  date?: string
  hours?: number
  log_type?: TimeLogType
  description?: string
}

export function useTimeLogs(filters?: { deal_id?: string; user_id?: string; start_date?: string; end_date?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["time-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("time_logs")
        .select(`
          *,
          user:profiles!time_logs_user_id_fkey(id, full_name, avatar_url),
          deal:deals(id, name, company_name),
          task:tasks(id, title)
        `)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

      if (filters?.deal_id) {
        query = query.eq("deal_id", filters.deal_id)
      }
      if (filters?.user_id) {
        query = query.eq("user_id", filters.user_id)
      }
      if (filters?.start_date) {
        query = query.gte("date", filters.start_date)
      }
      if (filters?.end_date) {
        query = query.lte("date", filters.end_date)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      return data
    },
  })
}

export function useCreateTimeLog() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateTimeLogInput) => {
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

      const { data, error } = await supabase
        .from("time_logs")
        .insert({
          ...input,
          user_id: user.id,
          company_id: profile.company_id,
        })
        .select(`
          *,
          deal:deals(id, name),
          task:tasks(id, title)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate both time logs and deals (for updated totals)
      queryClient.invalidateQueries({ queryKey: ["time-logs"] })
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["deal-time-totals"] })
    },
  })
}

export function useUpdateTimeLog() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTimeLogInput) => {
      const { data, error } = await supabase
        .from("time_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] })
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["deal-time-totals"] })
    },
  })
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_logs")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] })
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["deal-time-totals"] })
    },
  })
}

// Server-side calculation of hours per deal
export function useDealTimeTotals() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["deal-time-totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_time_summary")
        .select("*")

      if (error) throw error

      // Convert to a map for easy lookup
      const totalsMap: Record<string, { total_hours: number; billable_hours: number; total_cost: number }> = {}
      data?.forEach((item) => {
        totalsMap[item.deal_id] = {
          total_hours: item.total_hours || 0,
          billable_hours: item.billable_hours || 0,
          total_cost: item.total_cost || 0,
        }
      })

      return totalsMap
    },
  })
}

// Weekly summary for current user
export function useWeeklyTimeSummary() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["weekly-time-summary"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get start of current week
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const startDate = startOfWeek.toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("time_logs")
        .select("hours, log_type")
        .eq("user_id", user.id)
        .gte("date", startDate)

      if (error) throw error

      const total = data?.reduce((sum, log) => sum + log.hours, 0) || 0
      const billable = data?.filter((log) => log.log_type === "billable")
        .reduce((sum, log) => sum + log.hours, 0) || 0

      return { total, billable, nonBillable: total - billable }
    },
  })
}
