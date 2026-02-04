"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { DealStatus, EngagementType, ClientSize } from "@/types/database"

interface CreateDealInput {
  name: string
  company_name: string // Client name
  description?: string
  stage_id: string
  // Brand positioning fields
  engagement_type?: EngagementType
  project_value?: number
  budget?: number
  hours_budgeted?: number
  start_date?: string
  end_date?: string
  client_industry?: string
  client_size?: ClientSize
  deliverables?: string
  win_likelihood?: number
  // Account lead
  lead_partner_id?: string
  deal_source?: string
}

interface UpdateDealInput {
  id: string
  name?: string
  company_name?: string
  description?: string
  stage_id?: string
  status?: DealStatus
  engagement_type?: EngagementType
  project_value?: number
  budget?: number
  hours_budgeted?: number
  start_date?: string
  end_date?: string
  client_industry?: string
  client_size?: ClientSize
  deliverables?: string
  win_likelihood?: number
  lead_partner_id?: string
  deal_source?: string
}

export function useDeals(filters?: { stage_id?: string; status?: DealStatus }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["deals", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) return []

      let query = supabase
        .from("deals")
        .select(`
          *,
          stage:stages(*),
          lead_partner:profiles!deals_lead_partner_id_fkey(id, full_name, avatar_url),
          created_by:profiles!deals_created_by_id_fkey(id, full_name)
        `)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })

      if (filters?.stage_id) {
        query = query.eq("stage_id", filters.stage_id)
      }
      if (filters?.status) {
        query = query.eq("status", filters.status)
      } else {
        query = query.eq("status", "active")
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

export function useDeal(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          stage:stages(*),
          lead_partner:profiles!deals_lead_partner_id_fkey(*),
          created_by:profiles!deals_created_by_id_fkey(*),
          members:deal_members(
            id,
            role,
            user:profiles(*)
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateDealInput) => {
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
        .from("deals")
        .insert({
          ...input,
          created_by_id: user.id,
          company_id: profile.company_id,
        })
        .select(`
          *,
          stage:stages(*)
        `)
        .single()

      if (error) throw error

      // Add creator as deal member
      await supabase.from("deal_members").insert({
        deal_id: data.id,
        user_id: user.id,
        role: "lead",
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateDealInput) => {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["deal", data.id] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] })
    },
  })
}

export function useMoveDealToStage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .update({ stage_id: stageId })
        .eq("id", dealId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - set status to closed_lost
      const { error } = await supabase
        .from("deals")
        .update({ status: "closed_lost" })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] })
    },
  })
}

export function useStages() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) return []

      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("position")

      if (error) throw error
      return data
    },
  })
}

export function useUsers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) return []

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      return data
    },
  })
}
