"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useCreateDeal, useStages, useUsers } from "@/hooks/use-deals"
import type { EngagementType, ClientSize } from "@/types/database"

interface CreateDealModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateDealModal({ isOpen, onClose }: CreateDealModalProps) {
  const [name, setName] = useState("")
  const [clientName, setClientName] = useState("")
  const [description, setDescription] = useState("")
  const [stageId, setStageId] = useState("")
  const [engagementType, setEngagementType] = useState<EngagementType>("project")
  const [projectValue, setProjectValue] = useState("")
  const [budget, setBudget] = useState("")
  const [hoursBudgeted, setHoursBudgeted] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [clientIndustry, setClientIndustry] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [accountLeadId, setAccountLeadId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: stages } = useStages()
  const { data: users } = useUsers()
  const createDeal = useCreateDeal()

  // Set default stage when stages load
  if (stages && stages.length > 0 && !stageId) {
    setStageId(stages[0].id)
  }

  const teamLeads = users?.filter((u) => u.role === "admin" || u.role === "partner") || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Project name is required")
      return
    }
    if (!clientName.trim()) {
      setError("Client name is required")
      return
    }
    if (!stageId) {
      setError("Please select a stage")
      return
    }

    try {
      await createDeal.mutateAsync({
        name: name.trim(),
        company_name: clientName.trim(),
        description: description.trim() || undefined,
        stage_id: stageId,
        engagement_type: engagementType,
        project_value: projectValue ? parseFloat(projectValue) : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        hours_budgeted: hoursBudgeted ? parseFloat(hoursBudgeted) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        client_industry: clientIndustry.trim() || undefined,
        deliverables: deliverables.trim() || undefined,
        lead_partner_id: accountLeadId || undefined,
      })

      // Reset form
      setName("")
      setClientName("")
      setDescription("")
      setStageId(stages?.[0]?.id || "")
      setEngagementType("project")
      setProjectValue("")
      setBudget("")
      setHoursBudgeted("")
      setStartDate("")
      setEndDate("")
      setClientIndustry("")
      setDeliverables("")
      setAccountLeadId("")
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create project")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project" className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brand Refresh, Positioning Strategy, etc."
            required
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Acme Corp"
            required
          />
        </div>

        {/* Engagement Type & Stage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Engagement Type</label>
            <select
              value={engagementType}
              onChange={(e) => setEngagementType(e.target.value as EngagementType)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="project">Project</option>
              <option value="retainer">Retainer</option>
              <option value="pitch">Pitch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {stages?.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Value & Budget */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Value ($)</label>
            <input
              type="number"
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Budget ($)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="45000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hours Budget</label>
            <input
              type="number"
              value={hoursBudgeted}
              onChange={(e) => setHoursBudgeted(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="200"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Client Industry */}
        <div>
          <label className="block text-sm font-medium mb-1">Client Industry</label>
          <input
            type="text"
            value={clientIndustry}
            onChange={(e) => setClientIndustry(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Technology, Healthcare, etc."
          />
        </div>

        {/* Account Lead */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Lead</label>
          <select
            value={accountLeadId}
            onChange={(e) => setAccountLeadId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Unassigned</option>
            {teamLeads.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>



        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brief project description..."
            rows={2}
          />
        </div>

        {/* Deliverables */}
        <div>
          <label className="block text-sm font-medium mb-1">Key Deliverables</label>
          <textarea
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brand strategy, Visual identity, Messaging framework..."
            rows={2}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createDeal.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {createDeal.isPending ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
