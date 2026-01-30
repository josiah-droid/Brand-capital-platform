import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

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
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, company:companies(*)")
    .eq("id", user.id)
    .single()

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
