"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface CreateStageInput {
  name: string
  description?: string
  color?: string
  position: number
  is_terminal?: boolean
}

interface UpdateStageInput {
  id: string
  name?: string
  description?: string
  color?: string
  position?: number
  is_terminal?: boolean
}

export function useStagesAdmin() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["stages-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .order("position")

      if (error) throw error
      return data
    },
  })
}

export function useCreateStage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateStageInput) => {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) throw new Error("No company found. Please complete onboarding.")

      const { data, error } = await supabase
        .from("stages")
        .insert({ ...input, company_id: profile.company_id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages-admin"] })
      queryClient.invalidateQueries({ queryKey: ["stages"] })
    },
  })
}

export function useUpdateStage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStageInput) => {
      const { data, error } = await supabase
        .from("stages")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages-admin"] })
      queryClient.invalidateQueries({ queryKey: ["stages"] })
    },
  })
}

export function useReorderStages() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (stages: { id: string; position: number }[]) => {
      // Update each stage's position
      const updates = stages.map(({ id, position }) =>
        supabase.from("stages").update({ position }).eq("id", id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter((r) => r.error)

      if (errors.length > 0) {
        throw new Error("Failed to reorder stages")
      }

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages-admin"] })
      queryClient.invalidateQueries({ queryKey: ["stages"] })
    },
  })
}

export function useDeleteStage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if any deals are in this stage
      const { data: deals, error: checkError } = await supabase
        .from("deals")
        .select("id")
        .eq("stage_id", id)
        .eq("status", "active")
        .limit(1)

      if (checkError) throw checkError

      if (deals && deals.length > 0) {
        throw new Error("DEALS_EXIST")
      }

      const { error } = await supabase
        .from("stages")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages-admin"] })
      queryClient.invalidateQueries({ queryKey: ["stages"] })
    },
  })
}

// Get count of deals in a stage
export function useStageDealsCount(stageId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["stage-deals-count", stageId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("stage_id", stageId)
        .eq("status", "active")

      if (error) throw error
      return count || 0
    },
    enabled: !!stageId,
  })
}
