"use client"

import { useState } from "react"
import {
  useStagesAdmin,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
} from "@/hooks/use-stages"
import { useDeals } from "@/hooks/use-deals"
import { Modal } from "@/components/ui/modal"
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

export function PipelineEditor() {
  const [editingStage, setEditingStage] = useState<any | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [moveDealsModal, setMoveDealsModal] = useState<{ stageId: string; stageName: string } | null>(null)

  const { data: stages, isLoading } = useStagesAdmin()
  const { data: deals } = useDeals()
  const createStage = useCreateStage()
  const updateStage = useUpdateStage()
  const deleteStage = useDeleteStage()
  const reorderStages = useReorderStages()

  // Count deals per stage
  const dealCounts: Record<string, number> = {}
  deals?.forEach((deal) => {
    dealCounts[deal.stage_id] = (dealCounts[deal.stage_id] || 0) + 1
  })

  const handleMoveUp = (index: number) => {
    if (!stages || index === 0) return

    const newStages = [...stages]
    const temp = newStages[index].position
    newStages[index].position = newStages[index - 1].position
    newStages[index - 1].position = temp

    reorderStages.mutate([
      { id: newStages[index].id, position: newStages[index].position },
      { id: newStages[index - 1].id, position: newStages[index - 1].position },
    ])
  }

  const handleMoveDown = (index: number) => {
    if (!stages || index === stages.length - 1) return

    const newStages = [...stages]
    const temp = newStages[index].position
    newStages[index].position = newStages[index + 1].position
    newStages[index + 1].position = temp

    reorderStages.mutate([
      { id: newStages[index].id, position: newStages[index].position },
      { id: newStages[index + 1].id, position: newStages[index + 1].position },
    ])
  }

  const handleDelete = async (id: string, name: string) => {
    const count = dealCounts[id] || 0

    if (count > 0) {
      setMoveDealsModal({ stageId: id, stageName: name })
      return
    }

    setDeleteConfirm({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteStage.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error: any) {
      if (error.message === "DEALS_EXIST") {
        setMoveDealsModal({
          stageId: deleteConfirm.id,
          stageName: deleteConfirm.name,
        })
      }
      setDeleteConfirm(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pipeline Stages</h2>
          <p className="text-sm text-muted-foreground">
            Configure deal pipeline stages. Drag to reorder.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Stage
        </button>
      </div>

      {/* Stage List */}
      <div className="space-y-2">
        {stages?.map((stage, index) => (
          <div
            key={stage.id}
            className="flex items-center gap-3 p-3 bg-white border rounded-lg"
          >
            {/* Reorder Buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === stages.length - 1}
                className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Color Dot */}
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />

            {/* Stage Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{stage.name}</span>
                {stage.is_terminal && (
                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    Terminal
                  </span>
                )}
              </div>
              {stage.description && (
                <p className="text-sm text-muted-foreground">{stage.description}</p>
              )}
            </div>

            {/* Deal Count */}
            <div className="text-sm text-muted-foreground">
              {dealCounts[stage.id] || 0} deals
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditingStage(stage)}
                className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(stage.id, stage.name)}
                className="p-2 hover:bg-red-50 rounded-md text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <StageFormModal
        isOpen={isCreateModalOpen || !!editingStage}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingStage(null)
        }}
        stage={editingStage}
        nextPosition={(stages?.length || 0) + 1}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Stage"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the stage &quot;{deleteConfirm.name}&quot;?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Move Deals Warning */}
      {moveDealsModal && (
        <Modal
          isOpen={!!moveDealsModal}
          onClose={() => setMoveDealsModal(null)}
          title="Cannot Delete Stage"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  Active deals in this stage
                </p>
                <p className="text-sm text-yellow-700">
                  The stage &quot;{moveDealsModal.stageName}&quot; has active deals.
                  Please move them to another stage before deleting.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setMoveDealsModal(null)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Got it
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

interface StageFormModalProps {
  isOpen: boolean
  onClose: () => void
  stage?: any
  nextPosition: number
}

function StageFormModal({ isOpen, onClose, stage, nextPosition }: StageFormModalProps) {
  const [name, setName] = useState(stage?.name || "")
  const [description, setDescription] = useState(stage?.description || "")
  const [color, setColor] = useState(stage?.color || "#6B7280")
  const [isTerminal, setIsTerminal] = useState(stage?.is_terminal || false)
  const [error, setError] = useState<string | null>(null)

  const createStage = useCreateStage()
  const updateStage = useUpdateStage()

  // Reset form when stage changes
  useState(() => {
    if (stage) {
      setName(stage.name)
      setDescription(stage.description || "")
      setColor(stage.color)
      setIsTerminal(stage.is_terminal)
    } else {
      setName("")
      setDescription("")
      setColor("#6B7280")
      setIsTerminal(false)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Stage name is required")
      return
    }

    try {
      if (stage) {
        await updateStage.mutateAsync({
          id: stage.id,
          name: name.trim(),
          description: description.trim() || null,
          color,
          is_terminal: isTerminal,
        })
      } else {
        await createStage.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          position: nextPosition,
          is_terminal: isTerminal,
        })
      }

      onClose()
      setName("")
      setDescription("")
      setColor("#6B7280")
      setIsTerminal(false)
    } catch (err: any) {
      setError(err.message || "Failed to save stage")
    }
  }

  const colorOptions = [
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#10B981", // Green
    "#6B7280", // Gray
    "#EC4899", // Pink
    "#14B8A6", // Teal
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stage ? "Edit Stage" : "Create Stage"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Stage Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Discovery"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brief description of this stage"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="flex gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? "border-gray-900" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Terminal Stage */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isTerminal"
            checked={isTerminal}
            onChange={(e) => setIsTerminal(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="isTerminal" className="text-sm">
            Terminal stage (deals here are considered closed)
          </label>
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
            disabled={createStage.isPending || updateStage.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {createStage.isPending || updateStage.isPending
              ? "Saving..."
              : stage
              ? "Update Stage"
              : "Create Stage"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
