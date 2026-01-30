"use client"

import { useState, useMemo } from "react"
import { formatCurrency, formatHours } from "@/lib/utils"
import { useDeals, useStages, useMoveDealToStage, useUsers } from "@/hooks/use-deals"
import { useDealTimeTotals } from "@/hooks/use-time-logs"
import type { Deal, Stage, Profile, EngagementType, ClientSize } from "@/types/database"
import { Building2, Calendar, Clock, User, Loader2, Briefcase, Filter, X, Search } from "lucide-react"
import { CreateDealModal } from "./create-deal-modal"
import { DealDetailModal } from "./deal-detail-modal"

// Extended Deal type with relations for the pipeline
interface DealWithRelations extends Deal {
  stage?: Stage
  lead_partner?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null
  created_by?: Pick<Profile, "id" | "full_name"> | null
}

interface Filters {
  search: string
  engagementType: EngagementType | ""
  leadPartnerId: string
  clientSize: ClientSize | ""
  hasTimeLogged: boolean | null
  overBudget: boolean | null
}

const defaultFilters: Filters = {
  search: "",
  engagementType: "",
  leadPartnerId: "",
  clientSize: "",
  hasTimeLogged: null,
  overBudget: null,
}

export function DealPipeline() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const { data: stages, isLoading: stagesLoading } = useStages()
  const { data: deals, isLoading: dealsLoading } = useDeals()
  const { data: timeTotals } = useDealTimeTotals()
  const { data: users } = useUsers()
  const moveDeal = useMoveDealToStage()

  // Filter deals
  const filteredDeals = useMemo(() => {
    if (!deals) return []

    return deals.filter((deal) => {
      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          deal.name.toLowerCase().includes(searchLower) ||
          deal.company_name.toLowerCase().includes(searchLower) ||
          deal.description?.toLowerCase().includes(searchLower) ||
          deal.client_industry?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Engagement type
      if (filters.engagementType && deal.engagement_type !== filters.engagementType) {
        return false
      }

      // Lead partner
      if (filters.leadPartnerId && deal.lead_partner_id !== filters.leadPartnerId) {
        return false
      }

      // Client size
      if (filters.clientSize && deal.client_size !== filters.clientSize) {
        return false
      }

      // Has time logged
      if (filters.hasTimeLogged !== null) {
        const hasTime = (timeTotals?.[deal.id]?.total_hours || 0) > 0
        if (filters.hasTimeLogged !== hasTime) return false
      }

      // Over budget
      if (filters.overBudget !== null) {
        const totalHours = timeTotals?.[deal.id]?.total_hours || 0
        const hoursBudgeted = deal.hours_budgeted || 0
        const isOver = hoursBudgeted > 0 && totalHours > hoursBudgeted
        if (filters.overBudget !== isOver) return false
      }

      return true
    })
  }, [deals, filters, timeTotals])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.engagementType) count++
    if (filters.leadPartnerId) count++
    if (filters.clientSize) count++
    if (filters.hasTimeLogged !== null) count++
    if (filters.overBudget !== null) count++
    return count
  }, [filters])

  const clearFilters = () => setFilters(defaultFilters)

  if (stagesLoading || dealsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get unique team leads for filter dropdown
  const teamLeads = users?.filter((u) => u.role === "admin" || u.role === "partner") || []

  // Group filtered deals by stage
  const dealsByStage = (stages || []).reduce(
    (acc, stage) => {
      acc[stage.id] = filteredDeals.filter((deal) => deal.stage_id === stage.id)
      return acc
    },
    {} as Record<string, DealWithRelations[]>
  )

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId)
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData("dealId")
    if (dealId) {
      moveDeal.mutate({ dealId, stageId })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Project Pipeline</h1>
          <p className="text-muted-foreground">
            {filteredDeals.length === deals?.length
              ? `${deals?.length || 0} active projects`
              : `${filteredDeals.length} of ${deals?.length || 0} projects`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary/10 border-primary text-primary"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Filter Projects</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Project name, client..."
                  className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm"
                />
              </div>
            </div>

            {/* Engagement Type */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select
                value={filters.engagementType}
                onChange={(e) => setFilters({ ...filters, engagementType: e.target.value as EngagementType | "" })}
                className="w-full px-2 py-1.5 border rounded-md text-sm"
              >
                <option value="">All types</option>
                <option value="project">Project</option>
                <option value="retainer">Retainer</option>
                <option value="pitch">Pitch</option>
              </select>
            </div>

            {/* Account Lead */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account Lead</label>
              <select
                value={filters.leadPartnerId}
                onChange={(e) => setFilters({ ...filters, leadPartnerId: e.target.value })}
                className="w-full px-2 py-1.5 border rounded-md text-sm"
              >
                <option value="">All leads</option>
                {teamLeads.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Size */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Client Size</label>
              <select
                value={filters.clientSize}
                onChange={(e) => setFilters({ ...filters, clientSize: e.target.value as ClientSize | "" })}
                className="w-full px-2 py-1.5 border rounded-md text-sm"
              >
                <option value="">All sizes</option>
                <option value="startup">Startup</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Budget Status */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Budget</label>
              <select
                value={filters.overBudget === null ? "" : filters.overBudget ? "over" : "under"}
                onChange={(e) => setFilters({
                  ...filters,
                  overBudget: e.target.value === "" ? null : e.target.value === "over"
                })}
                className="w-full px-2 py-1.5 border rounded-md text-sm"
              >
                <option value="">Any</option>
                <option value="over">Over budget</option>
                <option value="under">Under budget</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages?.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-slate-100 rounded-lg"
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragOver={handleDragOver}
          >
            {/* Stage Header */}
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-medium text-sm">{stage.name}</span>
                <span className="ml-auto text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full">
                  {dealsByStage[stage.id]?.length || 0}
                </span>
              </div>
            </div>

            {/* Deal Cards */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {dealsByStage[stage.id]?.map((deal) => (
                <ProjectCard
                  key={deal.id}
                  deal={deal}
                  totalHours={timeTotals?.[deal.id]?.total_hours || 0}
                  hoursBudgeted={deal.hours_budgeted}
                  onDragStart={(e) => handleDragStart(e, deal.id)}
                  onClick={() => setSelectedDealId(deal.id)}
                />
              ))}

              {(!dealsByStage[stage.id] || dealsByStage[stage.id].length === 0) && (
                <div className="p-4 text-center text-sm text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg">
                  Drop projects here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedDealId && (
        <DealDetailModal
          dealId={selectedDealId}
          isOpen={!!selectedDealId}
          onClose={() => setSelectedDealId(null)}
        />
      )}
    </div>
  )
}

interface ProjectCardProps {
  deal: DealWithRelations
  totalHours: number
  hoursBudgeted?: number | null
  onDragStart: (e: React.DragEvent) => void
  onClick: () => void
}

function ProjectCard({ deal, totalHours, hoursBudgeted, onDragStart, onClick }: ProjectCardProps) {
  const engagementTypeLabels: Record<EngagementType, string> = {
    project: "Project",
    retainer: "Retainer",
    pitch: "Pitch",
  }

  const engagementTypeColors: Record<EngagementType, string> = {
    project: "bg-blue-100 text-blue-700",
    retainer: "bg-green-100 text-green-700",
    pitch: "bg-amber-100 text-amber-700",
  }

  // Calculate budget utilization
  const budgetUtilization = hoursBudgeted != null && hoursBudgeted > 0
    ? Math.round((totalHours / hoursBudgeted) * 100)
    : null

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Project Name & Client */}
      <div className="mb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-1">{deal.name}</h3>
          {deal.engagement_type && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${engagementTypeColors[deal.engagement_type]}`}>
              {engagementTypeLabels[deal.engagement_type]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="w-3 h-3" />
          <span className="line-clamp-1">{deal.company_name}</span>
        </div>
      </div>

      {/* Project Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-xs">
          <span className="text-muted-foreground">Value</span>
          <p className="font-medium">
            {deal.project_value ? formatCurrency(deal.project_value) : deal.investment_amount ? formatCurrency(deal.investment_amount) : "-"}
          </p>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Win %</span>
          <p className="font-medium">{deal.win_likelihood ?? deal.probability_to_close ?? 50}%</p>
        </div>
      </div>

      {/* Time Logged with Budget */}
      {(totalHours > 0 || hoursBudgeted) && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="w-3 h-3" />
              <span>{formatHours(totalHours)} logged</span>
            </div>
            {hoursBudgeted && (
              <span className="text-muted-foreground">/ {formatHours(hoursBudgeted)} budget</span>
            )}
          </div>
          {budgetUtilization !== null && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetUtilization > 100 ? "bg-red-500" :
                  budgetUtilization > 80 ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        {/* Account Lead */}
        {deal.lead_partner ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
              {deal.lead_partner.full_name?.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}

        {/* End Date or Timeline */}
        {(deal.end_date || deal.expected_close_date) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(deal.end_date || deal.expected_close_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  )
}
