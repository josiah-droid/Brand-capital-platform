"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types/database"

export function useCompany() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) return null

      const { data: company, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single()

      if (error) throw error
      return company
    },
  })
}

export function useCompanyMembers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["company-members"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

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
        .order("role")
        .order("full_name")

      if (error) throw error
      return data
    },
  })
}

export function useCompanyInvitations() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["company-invitations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) return []

      const { data, error } = await supabase
        .from("company_invitations")
        .select("*, invited_by:profiles!company_invitations_invited_by_id_fkey(full_name)")
        .eq("company_id", profile.company_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({ name, slug })
        .select()
        .single()

      if (companyError) throw companyError

      // Update user profile with company_id and make them admin
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ company_id: company.id, role: "admin" })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Create default stages for the company (brand positioning workflow)
      const defaultStages = [
        { name: "Inquiry", description: "New leads and inquiries", color: "#3B82F6", position: 1, is_terminal: false },
        { name: "Proposal", description: "Scoping and proposal sent", color: "#8B5CF6", position: 2, is_terminal: false },
        { name: "Active", description: "Project in progress", color: "#F59E0B", position: 3, is_terminal: false },
        { name: "Completed", description: "Project delivered", color: "#10B981", position: 4, is_terminal: true },
        { name: "Lost", description: "Did not proceed", color: "#6B7280", position: 5, is_terminal: true },
      ]

      await supabase.from("stages").insert(
        defaultStages.map((stage) => ({ ...stage, company_id: company.id }))
      )

      return company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] })
      queryClient.invalidateQueries({ queryKey: ["stages"] })
    },
  })
}

export function useJoinCompany() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Find company by invite code
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("invite_code", inviteCode.toLowerCase().trim())
        .single()

      if (companyError || !company) {
        throw new Error("Invalid invite code")
      }

      // Update user profile with company_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ company_id: company.id })
        .eq("id", user.id)

      if (profileError) throw profileError

      return company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] })
    },
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: UserRole }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) throw new Error("No company found")

      const { data, error } = await supabase
        .from("company_invitations")
        .insert({
          company_id: profile.company_id,
          email: email.toLowerCase().trim(),
          role,
          invited_by_id: user.id,
        })
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          throw new Error("This email has already been invited")
        }
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-invitations"] })
    },
  })
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("company_invitations")
        .delete()
        .eq("id", invitationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-invitations"] })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("companies")
        .update({ name })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] })
    },
  })
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (companyId: string) => {
      // Generate a new random invite code
      const newCode = Array.from(
        { length: 12 },
        () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
      ).join("")

      const { data, error } = await supabase
        .from("companies")
        .update({ invite_code: newCode })
        .eq("id", companyId)
        .select("invite_code")
        .single()

      if (error) throw error
      return data.invite_code
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] })
    },
  })
}
