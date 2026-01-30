"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCreateCompany, useJoinCompany } from "@/hooks/use-company"
import { Building2, Users, ArrowRight, Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"select" | "create" | "join">("select")
  const [companyName, setCompanyName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const createCompany = useCreateCompany()
  const joinCompany = useJoinCompany()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyName.trim()) {
      setError("Company name is required")
      return
    }

    try {
      await createCompany.mutateAsync({
        name: companyName.trim(),
        slug: generateSlug(companyName),
      })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to create company")
    }
  }

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inviteCode.trim()) {
      setError("Invite code is required")
      return
    }

    try {
      await joinCompany.mutateAsync(inviteCode)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to join company")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">BC</span>
          </div>
          <h1 className="text-2xl font-semibold">Welcome to Brandcapital</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up your workspace to get started
          </p>
        </div>

        {mode === "select" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full p-4 bg-white border rounded-lg hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Create a new company</h3>
                  <p className="text-sm text-muted-foreground">
                    Start fresh and invite your team members
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full p-4 bg-white border rounded-lg hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Join an existing company</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter an invite code to join your team
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreateCompany} className="bg-white p-6 rounded-lg border space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h2 className="font-semibold">Create your company</h2>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brandcapital Partners"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the name your team will see
              </p>
            </div>

            <button
              type="submit"
              disabled={createCompany.isPending}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createCompany.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Company"
              )}
            </button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoinCompany} className="bg-white p-6 rounded-lg border space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h2 className="font-semibold">Join your team</h2>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="abc123def456"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ask your team admin for the invite code
              </p>
            </div>

            <button
              type="submit"
              disabled={joinCompany.isPending}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joinCompany.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Company"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
