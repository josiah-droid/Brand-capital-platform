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
      console.log("[CreateCompany] Starting company creation...")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("[CreateCompany] Not authenticated")
        throw new Error("Not authenticated")
      }
      console.log("[CreateCompany] User authenticated:", user.id)

      // Create company
      console.log("[CreateCompany] Creating company:", name)
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({ name, slug })
        .select()
        .single()

      if (companyError) {
        console.error("[CreateCompany] Company creation failed:", companyError)
        throw companyError
      }
      console.log("[CreateCompany] Company created:", company.id)

      // Update user profile with company_id and make them admin
      console.log("[CreateCompany] Updating profile with company_id...")
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ company_id: company.id, role: "admin" })
        .eq("id", user.id)

      if (profileError) {
        console.error("[CreateCompany] Profile update failed:", profileError)
        throw profileError
      }
      console.log("[CreateCompany] Profile updated successfully")

      // Create default stages for the company (brand positioning workflow)
      console.log("[CreateCompany] Creating default stages...")
      const defaultStages = [
        { name: "Inquiry", description: "New leads and inquiries", color: "#3B82F6", position: 1, is_terminal: false },
        { name: "Proposal", description: "Scoping and proposal sent", color: "#8B5CF6", position: 2, is_terminal: false },
        { name: "Active", description: "Project in progress", color: "#F59E0B", position: 3, is_terminal: false },
        { name: "Completed", description: "Project delivered", color: "#10B981", position: 4, is_terminal: true },
        { name: "Lost", description: "Did not proceed", color: "#6B7280", position: 5, is_terminal: true },
      ]

      const { error: stagesError } = await supabase.from("stages").insert(
        defaultStages.map((stage) => ({ ...stage, company_id: company.id }))
      )

      if (stagesError) {
        console.error("[CreateCompany] Stages creation failed:", stagesError)
        // Don't throw - stages are not critical
      } else {
        console.log("[CreateCompany] Stages created successfully")
      }

      console.log("[CreateCompany] Company creation complete!")
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

      // Fetch profile AND company name
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, full_name, company:companies(name)")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) throw new Error("No company found")

      // @ts-ignore - Supabase types might not perfectly match the join, but it works
      const companyName = profile.company?.name || "your company"
      const inviterName = profile.full_name || "A colleague"

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      const { data, error } = await supabase
        .from("company_invitations")
        .insert({
          company_id: profile.company_id,
          email: email.toLowerCase().trim(),
          role,
          invited_by_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          throw new Error("This email has already been invited")
        }
        throw error
      }

      const inviteLink = `${window.location.origin}/join/${token}`

      // Send Email via API
      try {
        await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            link: inviteLink,
            companyName,
            invitedBy: inviterName,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send email:", emailError)
        // We don't throw here because the invitation was created successfully.
        // The UI will show the link as a fallback.
      }

      return { ...data, inviteLink }
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

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Find the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("company_invitations")
        .select("*, company:companies(name)")
        .eq("token", token)
        .eq("status", "pending")
        .single()

      if (inviteError || !invitation) {
        throw new Error("Invalid or expired invitation")
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error("Invitation has expired")
      }

      // 2. Add user to company
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_id: invitation.company_id,
          role: invitation.role,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // 3. Mark invitation as accepted
      await supabase
        .from("company_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id)

      return invitation.company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] })
    },
  })
}
