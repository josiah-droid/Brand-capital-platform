"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface CreateActivityInput {
  deal_id: string
  action: string
  details?: Record<string, unknown>
}

export function useDealActivities(dealId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["deal-activities", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_activities")
        .select(`
          *,
          user:profiles(id, full_name, avatar_url)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
    enabled: !!dealId,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("deal_activities")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select(`
          *,
          user:profiles(id, full_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal-activities", data.deal_id] })
    },
  })
}

// Helper to log common activities
export function useLogActivity() {
  const createActivity = useCreateActivity()

  return {
    logStageChange: (dealId: string, fromStage: string, toStage: string) => {
      createActivity.mutate({
        deal_id: dealId,
        action: "stage_changed",
        details: { from: fromStage, to: toStage },
      })
    },
    logNoteAdded: (dealId: string) => {
      createActivity.mutate({
        deal_id: dealId,
        action: "note_added",
      })
    },
    logTaskCreated: (dealId: string, taskTitle: string) => {
      createActivity.mutate({
        deal_id: dealId,
        action: "task_created",
        details: { task: taskTitle },
      })
    },
    logTimeLogged: (dealId: string, hours: number) => {
      createActivity.mutate({
        deal_id: dealId,
        action: "time_logged",
        details: { hours },
      })
    },
    logDealCreated: (dealId: string) => {
      createActivity.mutate({
        deal_id: dealId,
        action: "deal_created",
      })
    },
    logDealUpdated: (dealId: string, fields: string[]) => {
      createActivity.mutate({
        deal_id: dealId,
        action: "deal_updated",
        details: { fields },
      })
    },
  }
}
