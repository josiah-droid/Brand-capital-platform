"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useCreateTimeLog } from "@/hooks/use-time-logs"
import { useDeals } from "@/hooks/use-deals"
import type { TimeLogType } from "@/types/database"

interface CreateTimeLogModalProps {
  isOpen: boolean
  onClose: () => void
  defaultDealId?: string
}

export function CreateTimeLogModal({ isOpen, onClose, defaultDealId }: CreateTimeLogModalProps) {
  const today = new Date().toISOString().split("T")[0]

  const [dealId, setDealId] = useState(defaultDealId || "")
  const [date, setDate] = useState(today)
  const [hours, setHours] = useState("")
  const [logType, setLogType] = useState<TimeLogType>("billable")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: deals } = useDeals()
  const createTimeLog = useCreateTimeLog()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hours || parseFloat(hours) <= 0) {
      setError("Please enter valid hours")
      return
    }

    if (!description.trim()) {
      setError("Description is required")
      return
    }

    try {
      await createTimeLog.mutateAsync({
        deal_id: dealId || undefined,
        date,
        hours: parseFloat(hours),
        log_type: logType,
        description: description.trim(),
      })

      // Reset form and close
      setDealId(defaultDealId || "")
      setDate(today)
      setHours("")
      setLogType("billable")
      setDescription("")
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to log time")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Time">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Deal Selection */}
        <div>
          <label htmlFor="deal" className="block text-sm font-medium mb-1">
            Deal
          </label>
          <select
            id="deal"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">General (no deal)</option>
            {deals?.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name} - {deal.company_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Hours Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="hours" className="block text-sm font-medium mb-1">
              Hours <span className="text-red-500">*</span>
            </label>
            <input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., 2.5"
              required
            />
          </div>
        </div>

        {/* Log Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <div className="flex gap-4">
            {[
              { value: "billable", label: "Billable", color: "green" },
              { value: "non_billable", label: "Non-Billable", color: "gray" },
              { value: "internal", label: "Internal", color: "blue" },
            ].map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border ${
                  logType === type.value
                    ? type.color === "green"
                      ? "border-green-500 bg-green-50"
                      : type.color === "blue"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-500 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="logType"
                  value={type.value}
                  checked={logType === type.value}
                  onChange={(e) => setLogType(e.target.value as TimeLogType)}
                  className="sr-only"
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="What did you work on?"
            rows={3}
            required
          />
        </div>

        {/* Submit Button */}
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
            disabled={createTimeLog.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {createTimeLog.isPending ? "Logging..." : "Log Time"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
