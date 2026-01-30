import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatHours } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Target,
  Briefcase,
  AlertTriangle,
} from "lucide-react"

export default async function ReportsPage() {
  const supabase = await createClient()

  // Fetch active deals with analytics
  const { data: deals } = await supabase
    .from("deals")
    .select(`
      id, name, company_name, engagement_type, client_industry, client_size,
      project_value, budget, hours_budgeted, win_likelihood, status,
      start_date, end_date, created_at,
      stage:stages(name, color, is_terminal),
      lead_partner:profiles!deals_lead_partner_id_fkey(full_name)
    `)

  // Fetch time summaries
  const { data: timeSummary } = await supabase
    .from("deal_time_summary")
    .select("*")

  // Fetch team utilization (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: teamTime } = await supabase
    .from("time_logs")
    .select(`
      user_id, hours, log_type,
      user:profiles(id, full_name, role)
    `)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])

  // Calculate metrics
  const activeDeals = deals?.filter((d) => d.status === "active") || []
  const closedWonDeals = deals?.filter((d) => d.status === "closed_won") || []
  const closedLostDeals = deals?.filter((d) => d.status === "closed_lost") || []

  // Pipeline metrics
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + (d.project_value || 0), 0)
  const weightedPipelineValue = activeDeals.reduce(
    (sum, d) => sum + ((d.project_value || 0) * (d.win_likelihood || 50) / 100),
    0
  )
  const avgWinLikelihood = activeDeals.length > 0
    ? Math.round(activeDeals.reduce((sum, d) => sum + (d.win_likelihood || 50), 0) / activeDeals.length)
    : 0

  // Win/Loss metrics
  const totalClosed = closedWonDeals.length + closedLostDeals.length
  const winRate = totalClosed > 0
    ? Math.round((closedWonDeals.length / totalClosed) * 100)
    : 0
  const revenueWon = closedWonDeals.reduce((sum, d) => sum + (d.project_value || 0), 0)

  // Time metrics
  const timeByDeal = timeSummary?.reduce((acc, ts) => {
    acc[ts.deal_id] = ts
    return acc
  }, {} as Record<string, typeof timeSummary[0]>) || {}

  const totalHoursLogged = timeSummary?.reduce((sum, ts) => sum + (ts.total_hours || 0), 0) || 0
  const totalBillableHours = timeSummary?.reduce((sum, ts) => sum + (ts.billable_hours || 0), 0) || 0
  const billableRate = totalHoursLogged > 0
    ? Math.round((totalBillableHours / totalHoursLogged) * 100)
    : 0

  // Over budget projects
  const overBudgetDeals = activeDeals.filter((d) => {
    const ts = timeByDeal[d.id]
    return d.hours_budgeted && d.hours_budgeted > 0 && ts && ts.total_hours > d.hours_budgeted
  })

  // Team utilization
  const userHours = teamTime?.reduce((acc, tl) => {
    const userId = tl.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: tl.user,
        total: 0,
        billable: 0,
      }
    }
    acc[userId].total += tl.hours || 0
    if (tl.log_type === "billable") {
      acc[userId].billable += tl.hours || 0
    }
    return acc
  }, {} as Record<string, { user: any; total: number; billable: number }>) || {}

  // Engagement type breakdown
  const byEngagementType = activeDeals.reduce((acc, d) => {
    const type = d.engagement_type || "project"
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 }
    }
    acc[type].count++
    acc[type].value += d.project_value || 0
    return acc
  }, {} as Record<string, { count: number; value: number }>)

  // Client size breakdown
  const byClientSize = activeDeals.reduce((acc, d) => {
    const size = d.client_size || "unknown"
    if (!acc[size]) {
      acc[size] = { count: 0, value: 0 }
    }
    acc[size].count++
    acc[size].value += d.project_value || 0
    return acc
  }, {} as Record<string, { count: number; value: number }>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track performance, revenue, and team utilization
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Pipeline Value"
          value={formatCurrency(totalPipelineValue)}
          subtitle={`${formatCurrency(weightedPipelineValue)} weighted`}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Active Projects"
          value={activeDeals.length.toString()}
          subtitle={`${avgWinLikelihood}% avg. win likelihood`}
          icon={Briefcase}
          color="blue"
        />
        <KPICard
          title="Win Rate"
          value={`${winRate}%`}
          subtitle={`${closedWonDeals.length} won / ${totalClosed} closed`}
          icon={Target}
          trend={winRate >= 50 ? "up" : "down"}
          color="purple"
        />
        <KPICard
          title="Billable Rate"
          value={`${billableRate}%`}
          subtitle={`${formatHours(totalBillableHours)} of ${formatHours(totalHoursLogged)}`}
          icon={Clock}
          trend={billableRate >= 70 ? "up" : "down"}
          color="orange"
        />
      </div>

      {/* Alerts */}
      {overBudgetDeals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            {overBudgetDeals.length} project{overBudgetDeals.length > 1 ? "s" : ""} over budget
          </div>
          <div className="space-y-1">
            {overBudgetDeals.map((deal) => {
              const ts = timeByDeal[deal.id]
              return (
                <p key={deal.id} className="text-sm text-red-600">
                  {deal.name}: {formatHours(ts?.total_hours || 0)} / {formatHours(deal.hours_budgeted || 0)} budgeted
                </p>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Won */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-600">Revenue Won (Closed)</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(revenueWon)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600">Pipeline Value (Active)</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalPipelineValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-purple-600">Weighted Pipeline</p>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(weightedPipelineValue)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Engagement Type Breakdown */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">By Engagement Type</h2>
          <div className="space-y-3">
            {Object.entries(byEngagementType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    type === "project" ? "bg-blue-500" :
                    type === "retainer" ? "bg-green-500" : "bg-amber-500"
                  }`} />
                  <span className="capitalize font-medium">{type}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{data.count} projects</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Size Breakdown */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">By Client Size</h2>
          <div className="space-y-3">
            {Object.entries(byClientSize)
              .filter(([size]) => size !== "unknown")
              .sort((a, b) => {
                const order = ["enterprise", "medium", "small", "startup"]
                return order.indexOf(a[0]) - order.indexOf(b[0])
              })
              .map(([size, data]) => (
                <div key={size} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="capitalize font-medium">{size}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{data.count} clients</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
                  </div>
                </div>
              ))}
            {byClientSize.unknown && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Unspecified</span>
                <span>{byClientSize.unknown.count} clients</span>
              </div>
            )}
          </div>
        </div>

        {/* Team Utilization */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Team Utilization (30 days)</h2>
          <div className="space-y-3">
            {Object.values(userHours)
              .sort((a, b) => b.total - a.total)
              .slice(0, 10)
              .map((userData) => {
                const utilRate = userData.total > 0
                  ? Math.round((userData.billable / userData.total) * 100)
                  : 0
                return (
                  <div key={userData.user?.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{userData.user?.full_name || "Unknown"}</span>
                      </div>
                      <span className="text-sm">
                        {formatHours(userData.total)}
                        <span className="text-muted-foreground"> ({utilRate}% billable)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${utilRate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            {Object.keys(userHours).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No time logged in the last 30 days
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Projects by Value */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Top Active Projects by Value</h2>
        </div>
        <div className="divide-y">
          {activeDeals
            .sort((a, b) => (b.project_value || 0) - (a.project_value || 0))
            .slice(0, 10)
            .map((deal) => {
              const ts = timeByDeal[deal.id]
              const budgetPct = deal.hours_budgeted && deal.hours_budgeted > 0 && ts
                ? Math.round((ts.total_hours / deal.hours_budgeted) * 100)
                : null
              return (
                <div key={deal.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{deal.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        deal.engagement_type === "project" ? "bg-blue-100 text-blue-700" :
                        deal.engagement_type === "retainer" ? "bg-green-100 text-green-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {deal.engagement_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {deal.company_name} • {deal.lead_partner?.full_name || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(deal.project_value || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.win_likelihood}% likelihood
                      {budgetPct !== null && (
                        <span className={budgetPct > 100 ? " text-red-500" : ""}>
                          {" "}• {budgetPct}% budget used
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          {activeDeals.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No active projects
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down"
  color: "green" | "blue" | "purple" | "orange"
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
            {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}
