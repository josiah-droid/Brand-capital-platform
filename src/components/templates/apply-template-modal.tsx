"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { taskTemplates, calculateTemplateTotals, TaskTemplate } from "@/lib/task-templates"
import { useApplyTemplate } from "@/hooks/use-templates"
import { Loader2, Check, Clock, ChevronRight } from "lucide-react"

interface ApplyTemplateModalProps {
    isOpen: boolean
    onClose: () => void
    dealId: string
    dealStartDate?: string
}

export function ApplyTemplateModal({ isOpen, onClose, dealId, dealStartDate }: ApplyTemplateModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
    const [startDate, setStartDate] = useState(dealStartDate || new Date().toISOString().split("T")[0])
    const [isSuccess, setIsSuccess] = useState(false)

    const applyTemplate = useApplyTemplate()

    const handleApply = async () => {
        if (!selectedTemplate) return

        await applyTemplate.mutateAsync({
            templateId: selectedTemplate.id,
            dealId,
            startDate,
        })

        setIsSuccess(true)
        setTimeout(() => {
            setIsSuccess(false)
            setSelectedTemplate(null)
            onClose()
        }, 1500)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedTemplate ? `Apply: ${selectedTemplate.name}` : "Choose Template"}
            className="max-w-2xl"
        >
            {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-medium">Template Applied!</p>
                    <p className="text-muted-foreground">
                        {applyTemplate.data?.tasksCreated} tasks created
                    </p>
                </div>
            ) : selectedTemplate ? (
                <TemplateDetail
                    template={selectedTemplate}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    onBack={() => setSelectedTemplate(null)}
                    onApply={handleApply}
                    isApplying={applyTemplate.isPending}
                />
            ) : (
                <TemplateList
                    templates={taskTemplates}
                    onSelect={setSelectedTemplate}
                />
            )}
        </Modal>
    )
}

function TemplateList({ templates, onSelect }: { templates: TaskTemplate[]; onSelect: (t: TaskTemplate) => void }) {
    return (
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
                Select a template to quickly add pre-configured tasks to this project.
            </p>

            {templates.map((template) => {
                const totals = calculateTemplateTotals(template)

                return (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
                    >
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1">
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{totals.totalTasks} tasks</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {totals.totalHours}h estimated
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                )
            })}
        </div>
    )
}

function TemplateDetail({
    template,
    startDate,
    onStartDateChange,
    onBack,
    onApply,
    isApplying,
}: {
    template: TaskTemplate
    startDate: string
    onStartDateChange: (date: string) => void
    onBack: () => void
    onApply: () => void
    isApplying: boolean
}) {
    const totals = calculateTemplateTotals(template)
    const phases = ["Strategy", "Creative", "Production", "Revisions", "Admin"]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                    <h3 className="text-lg font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
            </div>

            {/* Start Date */}
            <div>
                <label className="block text-sm font-medium mb-1">Project Start Date</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm w-full max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Task due dates will be calculated relative to this date
                </p>
            </div>

            {/* Phase Breakdown */}
            <div>
                <h4 className="text-sm font-medium mb-2">Tasks by Phase</h4>
                <div className="grid grid-cols-5 gap-2">
                    {phases.map((phase) => {
                        const phaseData = totals.phaseBreakdown[phase]
                        if (!phaseData) return (
                            <div key={phase} className="p-2 bg-gray-50 rounded text-center">
                                <p className="text-xs font-medium text-muted-foreground">{phase}</p>
                                <p className="text-lg font-bold text-muted-foreground">0</p>
                            </div>
                        )

                        return (
                            <div key={phase} className="p-2 bg-gray-50 rounded text-center">
                                <p className="text-xs font-medium text-muted-foreground">{phase}</p>
                                <p className="text-lg font-bold">{phaseData.tasks}</p>
                                <p className="text-xs text-muted-foreground">{phaseData.hours}h</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Task Preview */}
            <div>
                <h4 className="text-sm font-medium mb-2">Tasks Preview</h4>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {template.tasks.map((task, index) => (
                        <div key={index} className="px-3 py-2 flex items-center gap-3 text-sm">
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                {task.phase}
                            </span>
                            <span className="flex-1">{task.title}</span>
                            <span className="text-muted-foreground">{task.estimatedHours}h</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                    <p className="text-sm text-blue-700">
                        This will create <strong>{totals.totalTasks} tasks</strong> with{" "}
                        <strong>{totals.totalHours}h</strong> total estimated time.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
                <button
                    onClick={onBack}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                >
                    ← Back
                </button>
                <button
                    onClick={onApply}
                    disabled={isApplying}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                    {isApplying ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Applying...
                        </>
                    ) : (
                        "Apply Template"
                    )}
                </button>
            </div>
        </div>
    )
}
