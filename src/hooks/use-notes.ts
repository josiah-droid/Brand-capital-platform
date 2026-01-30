"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface CreateNoteInput {
  deal_id: string
  content: string
  is_private?: boolean
}

interface UpdateNoteInput {
  id: string
  content?: string
  is_private?: boolean
}

export function useDealNotes(dealId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["deal-notes", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_notes")
        .select(`
          *,
          user:profiles(id, full_name, avatar_url)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!dealId,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("deal_notes")
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
      queryClient.invalidateQueries({ queryKey: ["deal-notes", data.deal_id] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateNoteInput) => {
      const { data, error } = await supabase
        .from("deal_notes")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          user:profiles(id, full_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal-notes", data.deal_id] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, dealId }: { id: string; dealId: string }) => {
      const { error } = await supabase
        .from("deal_notes")
        .delete()
        .eq("id", id)

      if (error) throw error
      return { dealId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal-notes", data.dealId] })
    },
  })
}
