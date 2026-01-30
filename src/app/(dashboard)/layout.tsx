import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  role: "admin" | "partner" | "associate"
  company_id: string | null
  company: { name: string } | null
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile with company
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, company_id, company:companies(name)")
    .eq("id", user.id)
    .single()
  const profile = profileRaw as UserProfile | null

  // Redirect to onboarding if user has no company
  if (!profile?.company_id) {
    redirect("/onboarding")
  }

  return (
    <DashboardShell>
      <div className="min-h-screen bg-slate-50">
        <Sidebar userRole={profile?.role || "associate"} companyName={profile?.company?.name} />
        <div className="lg:pl-64">
          <Header user={profile} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </DashboardShell>
  )
}
