import { createClient } from "@/lib/supabase/server"
import { Briefcase, CheckSquare, Clock, TrendingUp, Target, AlertTriangle } from "lucide-react"
import { formatCurrency, formatHours } from "@/lib/utils"
import Link from "next/link"

// Type definitions for Supabase queries
type DealBasic = {
  project_value: number | null
  win_likelihood: number | null
  hours_budgeted: number | null
}

type DealWithRelations = {
  id: string
  name: string
  company_name: string | null
  engagement_type: string | null
  project_value: number | null
  win_likelihood: number | null
  stage: { name: string; color: string } | null
  lead_partner: { full_name: string } | null
}

type PipelineStage = {
  stage_id: string
  stage_name: string
  color: string
  deal_count: number
}

type DealTimeSummary = {
  deal_id: string
  deal_name: string
  total_hours: number
  hours_budgeted: number | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch pipeline summary
  const { data: pipelineSummaryRaw } = await supabase
    .from("pipeline_summary")
    .select("*")
    .order("position")
  const pipelineSummary = pipelineSummaryRaw as PipelineStage[] | null

  // Fetch recent projects
  const { data: recentDealsRaw } = await supabase
    .from("deals")
    .select("id, name, company_name, engagement_type, project_value, win_likelihood, stage:stages(name, color), lead_partner:profiles!deals_lead_partner_id_fkey(full_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5)
  const recentDeals = recentDealsRaw as DealWithRelations[] | null

  // Fetch open tasks count
  const { count: openTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .in("status", ["todo", "in_progress"])

  // Fetch this week's hours
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const { data: weeklyTimeLogs } = await supabase
    .from("time_logs")
    .select("hours")
    .gte("date", startOfWeek.toISOString().split("T")[0])

  const hoursThisWeek = (weeklyTimeLogs as { hours: number }[] | null)?.reduce((sum, log) => sum + (log.hours || 0), 0) || 0

  // Calculate totals from deals directly (pipeline_summary may use old field)
  const { data: activeDealsRaw } = await supabase
    .from("deals")
    .select("project_value, win_likelihood, hours_budgeted")
    .eq("status", "active")
  const activeDeals = activeDealsRaw as DealBasic[] | null

  const totalProjects = activeDeals?.length || 0
  const totalPipelineValue = activeDeals?.reduce(
    (sum, d) => sum + (d.project_value || 0),
    0
  ) || 0
  const weightedPipelineValue = activeDeals?.reduce(
    (sum, d) => sum + ((d.project_value || 0) * (d.win_likelihood || 50) / 100),
    0
  ) || 0

  // Get projects with budget warnings
  const { data: dealTimeSummaryRaw } = await supabase
    .from("deal_time_summary")
    .select("deal_id, deal_name, total_hours, hours_budgeted")
  const dealTimeSummary = dealTimeSummaryRaw as DealTimeSummary[] | null

  const overBudgetProjects = dealTimeSummary?.filter(
    (d) => d.hours_budgeted && d.hours_budgeted > 0 && d.total_hours > d.hours_budgeted
  ) || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here&apos;s your project overview.
        </p>
      </div>

      {/* Budget Alerts */}
      {overBudgetProjects.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            {overBudgetProjects.length} project{overBudgetProjects.length > 1 ? "s" : ""} over budget
          </div>
          <div className="space-y-1">
            {overBudgetProjects.slice(0, 3).map((project) => (
              <p key={project.deal_id} className="text-sm text-red-600">
                {project.deal_name}: {formatHours(project.total_hours)} logged / {formatHours(project.hours_budgeted)} budgeted
              </p>
            ))}
            {overBudgetProjects.length > 3 && (
              <Link href="/deals" className="text-sm text-red-700 underline">
                View all {overBudgetProjects.length} over-budget projects
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={totalProjects.toString()}
          icon={Briefcase}
          color="blue"
          href="/deals"
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(totalPipelineValue)}
          description={`${formatCurrency(weightedPipelineValue)} weighted`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Open Tasks"
          value={(openTasksCount || 0).toString()}
          description="View tasks"
          icon={CheckSquare}
          color="orange"
          href="/tasks"
        />
        <StatCard
          title="Hours This Week"
          value={formatHours(hoursThisWeek)}
          description="View timesheets"
          icon={Clock}
          color="purple"
          href="/time"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pipeline Overview</h2>
          <Link href="/deals" className="text-sm text-primary hover:underline">
            View Pipeline
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {pipelineSummary?.map((stage) => (
            <div
              key={stage.stage_id}
              className="p-4 rounded-lg border hover:shadow-sm transition-shadow"
              style={{ borderColor: stage.color }}
            >
              <div
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: stage.color }}
              />
              <p className="text-sm font-medium">{stage.stage_name}</p>
              <p className="text-2xl font-bold">{stage.deal_count || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link href="/deals" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        {recentDeals && recentDeals.length > 0 ? (
          <div className="divide-y">
            {recentDeals.map((deal) => (
              <Link
                key={deal.id}
                href="/deals"
                className="p-4 flex items-center justify-between hover:bg-slate-50 block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{deal.name}</p>
                    {deal.engagement_type && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        deal.engagement_type === "project" ? "bg-blue-100 text-blue-700" :
                        deal.engagement_type === "retainer" ? "bg-green-100 text-green-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {deal.engagement_type === "project" ? "Project" :
                         deal.engagement_type === "retainer" ? "Retainer" : "Pitch"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {deal.company_name}
                    {deal.lead_partner?.full_name && (
                      <span className="ml-2">• {deal.lead_partner.full_name}</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${deal.stage?.color}20`,
                      color: deal.stage?.color,
                    }}
                  >
                    {deal.stage?.name}
                  </div>
                  {deal.project_value && (
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(deal.project_value)}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 justify-end">
                    <Target className="w-3 h-3" />
                    {deal.win_likelihood}% likelihood
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No projects yet.</p>
            <Link href="/deals" className="text-primary hover:underline text-sm">
              Create your first project
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  href,
}: {
  title: string
  value: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  color: "blue" | "green" | "orange" | "purple"
  href?: string
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  }

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow block">
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      {content}
    </div>
  )
}
