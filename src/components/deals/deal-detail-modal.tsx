"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useDeal, useUpdateDeal, useStages, useUsers } from "@/hooks/use-deals"
import { useDealTimeTotals } from "@/hooks/use-time-logs"
import { TaskList } from "@/components/tasks/task-list"
import { TimeLogList } from "@/components/time/time-log-list"
import { DealNotes } from "@/components/deals/deal-notes"
import { ActivityTimeline } from "@/components/deals/activity-timeline"
import { formatCurrency, formatHours, formatDate } from "@/lib/utils"
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  User,
  Loader2,
  Briefcase,
  Target,
  FileText,
  AlertTriangle
} from "lucide-react"
import type { EngagementType, ClientSize } from "@/types/database"

interface DealDetailModalProps {
  dealId: string
  isOpen: boolean
  onClose: () => void
}

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

const clientSizeLabels: Record<ClientSize, string> = {
  startup: "Startup",
  small: "Small Business",
  medium: "Medium Business",
  enterprise: "Enterprise",
}

export function DealDetailModal({ dealId, isOpen, onClose }: DealDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "time" | "notes" | "activity">("overview")

  const { data: deal, isLoading } = useDeal(dealId)
  const { data: stages } = useStages()
  const { data: timeTotals } = useDealTimeTotals()
  const updateDeal = useUpdateDeal()

  const totalHours = timeTotals?.[dealId]?.total_hours || 0
  const billableHours = timeTotals?.[dealId]?.billable_hours || 0
  const hoursBudgeted = deal?.hours_budgeted || 0

  // Calculate budget utilization
  const budgetUtilization = hoursBudgeted > 0
    ? Math.round((totalHours / hoursBudgeted) * 100)
    : null
  const isOverBudget = budgetUtilization !== null && budgetUtilization > 100
  const isNearBudget = budgetUtilization !== null && budgetUtilization > 80 && budgetUtilization <= 100

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." className="max-w-3xl">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Modal>
    )
  }

  if (!deal) {
    return null
  }

  const handleStageChange = (stageId: string) => {
    updateDeal.mutate({ id: dealId, stage_id: stageId })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deal.name} className="max-w-4xl">
      <div className="space-y-4">
        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{deal.company_name}</span>
              </div>
              {deal.engagement_type && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${engagementTypeColors[deal.engagement_type]}`}>
                  {engagementTypeLabels[deal.engagement_type]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {deal.client_industry && <span>{deal.client_industry}</span>}
              {deal.client_size && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {clientSizeLabels[deal.client_size]}
                </span>
              )}
            </div>
          </div>

          {/* Stage Selector */}
          <select
            value={deal.stage_id}
            onChange={(e) => handleStageChange(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm font-medium"
            style={{
              borderColor: deal.stage?.color,
              backgroundColor: `${deal.stage?.color}15`,
            }}
          >
            {stages?.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Alert */}
        {isOverBudget && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span>
              <strong>Over Budget:</strong> This project has used {budgetUtilization}% of budgeted hours
              ({formatHours(totalHours)} of {formatHours(hoursBudgeted)})
            </span>
          </div>
        )}
        {isNearBudget && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span>
              <strong>Approaching Budget:</strong> {budgetUtilization}% of budgeted hours used
              ({formatHours(totalHours)} of {formatHours(hoursBudgeted)})
            </span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              Project Value
            </div>
            <p className="font-semibold">
              {deal.project_value ? formatCurrency(deal.project_value) : "-"}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Target className="w-3 h-3" />
              Win Likelihood
            </div>
            <p className="font-semibold">{deal.win_likelihood}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Hours Logged
            </div>
            <p className="font-semibold">
              {formatHours(totalHours)}
              {hoursBudgeted > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  {" "}/ {formatHours(hoursBudgeted)}
                </span>
              )}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Timeline
            </div>
            <p className="font-semibold text-sm">
              {deal.start_date || deal.end_date ? (
                <>
                  {deal.start_date ? formatDate(deal.start_date) : "TBD"}
                  {" → "}
                  {deal.end_date ? formatDate(deal.end_date) : "TBD"}
                </>
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        {hoursBudgeted > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className={`font-medium ${
                isOverBudget ? "text-red-600" :
                isNearBudget ? "text-amber-600" : "text-blue-600"
              }`}>
                {budgetUtilization}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverBudget ? "bg-red-500" :
                  isNearBudget ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(budgetUtilization || 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "tasks", label: "Tasks" },
              { id: "time", label: "Time Logs" },
              { id: "notes", label: "Notes" },
              { id: "activity", label: "Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Description */}
              {deal.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{deal.description}</p>
                </div>
              )}

              {/* Deliverables */}
              {deal.deliverables && (
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Key Deliverables
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{deal.deliverables}</p>
                </div>
              )}

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Project Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Project Value</dt>
                      <dd className="font-medium">
                        {deal.project_value ? formatCurrency(deal.project_value) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Budget</dt>
                      <dd className="font-medium">
                        {deal.budget ? formatCurrency(deal.budget) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Hours Budget</dt>
                      <dd className="font-medium">
                        {hoursBudgeted > 0 ? formatHours(hoursBudgeted) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Lead Source</dt>
                      <dd className="font-medium">{deal.deal_source || "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Team & Timeline</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Account Lead</dt>
                      <dd className="font-medium">
                        {deal.lead_partner?.full_name || "Unassigned"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created By</dt>
                      <dd className="font-medium">{deal.created_by?.full_name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Start Date</dt>
                      <dd className="font-medium">
                        {deal.start_date ? formatDate(deal.start_date) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">End Date</dt>
                      <dd className="font-medium">
                        {deal.end_date ? formatDate(deal.end_date) : "-"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Time Summary */}
              <div>
                <h4 className="text-sm font-medium mb-2">Time Summary</h4>
                <div className="flex gap-4">
                  <div className="bg-blue-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-blue-600">Total Logged</p>
                    <p className="font-semibold text-blue-700">{formatHours(totalHours)}</p>
                  </div>
                  <div className="bg-green-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-green-600">Billable</p>
                    <p className="font-semibold text-green-700">{formatHours(billableHours)}</p>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-600">Non-Billable</p>
                    <p className="font-semibold text-gray-700">
                      {formatHours(totalHours - billableHours)}
                    </p>
                  </div>
                  {hoursBudgeted > 0 && (
                    <div className={`px-3 py-2 rounded-lg ${
                      isOverBudget ? "bg-red-50" : "bg-gray-50"
                    }`}>
                      <p className={`text-xs ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
                        Remaining
                      </p>
                      <p className={`font-semibold ${isOverBudget ? "text-red-700" : "text-gray-700"}`}>
                        {formatHours(Math.max(0, hoursBudgeted - totalHours))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && <TaskList dealId={dealId} showDealColumn={false} />}

          {activeTab === "time" && <TimeLogList dealId={dealId} showSummary={false} />}

          {activeTab === "notes" && <DealNotes dealId={dealId} />}

          {activeTab === "activity" && <ActivityTimeline dealId={dealId} />}
        </div>
      </div>
    </Modal>
  )
}
