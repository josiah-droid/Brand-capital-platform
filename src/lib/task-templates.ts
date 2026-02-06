import type { TaskPriority, TaskPhase } from "@/types/database"

export interface TaskTemplate {
    id: string
    name: string
    description: string
    icon: string
    tasks: TemplateTask[]
}

export interface TemplateTask {
    title: string
    description?: string
    phase: TaskPhase
    priority: TaskPriority
    estimatedHours: number
    relativeDay?: number // Days from project start
}

export const taskTemplates: TaskTemplate[] = [
    {
        id: "brand-campaign",
        name: "Brand Campaign",
        description: "Full brand campaign from strategy to launch",
        icon: "🎯",
        tasks: [
            // Strategy Phase
            { title: "Kickoff meeting & brief review", phase: "Strategy", priority: "high", estimatedHours: 2, relativeDay: 0 },
            { title: "Competitive analysis", phase: "Strategy", priority: "medium", estimatedHours: 4, relativeDay: 1 },
            { title: "Audience research & personas", phase: "Strategy", priority: "high", estimatedHours: 6, relativeDay: 2 },
            { title: "Brand positioning workshop", phase: "Strategy", priority: "high", estimatedHours: 4, relativeDay: 5 },
            { title: "Strategy deck presentation", phase: "Strategy", priority: "high", estimatedHours: 4, relativeDay: 7 },

            // Creative Phase
            { title: "Visual concept exploration", phase: "Creative", priority: "high", estimatedHours: 8, relativeDay: 10 },
            { title: "Mood board & direction", phase: "Creative", priority: "medium", estimatedHours: 4, relativeDay: 12 },
            { title: "Key visual design", phase: "Creative", priority: "high", estimatedHours: 12, relativeDay: 14 },
            { title: "Copywriting - headlines & taglines", phase: "Creative", priority: "high", estimatedHours: 6, relativeDay: 14 },
            { title: "Creative presentation", phase: "Creative", priority: "high", estimatedHours: 3, relativeDay: 18 },

            // Production Phase
            { title: "Asset production - digital", phase: "Production", priority: "medium", estimatedHours: 16, relativeDay: 21 },
            { title: "Asset production - print", phase: "Production", priority: "medium", estimatedHours: 8, relativeDay: 21 },
            { title: "Final file delivery", phase: "Production", priority: "high", estimatedHours: 2, relativeDay: 28 },

            // Admin
            { title: "Project wrap-up & handoff", phase: "Admin", priority: "low", estimatedHours: 2, relativeDay: 30 },
        ],
    },
    {
        id: "video-production",
        name: "Video Production",
        description: "End-to-end video project from concept to delivery",
        icon: "🎬",
        tasks: [
            // Strategy
            { title: "Creative brief & concept development", phase: "Strategy", priority: "high", estimatedHours: 4, relativeDay: 0 },
            { title: "Script development", phase: "Strategy", priority: "high", estimatedHours: 8, relativeDay: 2 },
            { title: "Storyboard creation", phase: "Strategy", priority: "high", estimatedHours: 6, relativeDay: 5 },

            // Creative
            { title: "Script approval & revisions", phase: "Revisions", priority: "medium", estimatedHours: 3, relativeDay: 7 },
            { title: "Casting & talent selection", phase: "Creative", priority: "medium", estimatedHours: 4, relativeDay: 8 },
            { title: "Location scouting", phase: "Creative", priority: "medium", estimatedHours: 4, relativeDay: 8 },

            // Production
            { title: "Pre-production planning", phase: "Production", priority: "high", estimatedHours: 6, relativeDay: 10 },
            { title: "Shoot day 1", phase: "Production", priority: "urgent", estimatedHours: 10, relativeDay: 14 },
            { title: "Shoot day 2", phase: "Production", priority: "urgent", estimatedHours: 10, relativeDay: 15 },
            { title: "Rough cut edit", phase: "Production", priority: "high", estimatedHours: 12, relativeDay: 18 },
            { title: "Color grading & audio mix", phase: "Production", priority: "medium", estimatedHours: 8, relativeDay: 22 },

            // Revisions
            { title: "Client review round 1", phase: "Revisions", priority: "high", estimatedHours: 4, relativeDay: 24 },
            { title: "Final revisions", phase: "Revisions", priority: "high", estimatedHours: 4, relativeDay: 26 },

            // Admin
            { title: "Final render & delivery", phase: "Admin", priority: "high", estimatedHours: 2, relativeDay: 28 },
        ],
    },
    {
        id: "web-development",
        name: "Website Development",
        description: "Full website design and development",
        icon: "💻",
        tasks: [
            // Strategy
            { title: "Discovery & requirements gathering", phase: "Strategy", priority: "high", estimatedHours: 4, relativeDay: 0 },
            { title: "Sitemap & IA planning", phase: "Strategy", priority: "high", estimatedHours: 4, relativeDay: 2 },
            { title: "Technical specification", phase: "Strategy", priority: "medium", estimatedHours: 4, relativeDay: 3 },

            // Creative
            { title: "Wireframes - key pages", phase: "Creative", priority: "high", estimatedHours: 8, relativeDay: 5 },
            { title: "UI design - homepage", phase: "Creative", priority: "high", estimatedHours: 8, relativeDay: 8 },
            { title: "UI design - inner pages", phase: "Creative", priority: "high", estimatedHours: 12, relativeDay: 10 },
            { title: "Design system & components", phase: "Creative", priority: "medium", estimatedHours: 6, relativeDay: 14 },

            // Production
            { title: "Development environment setup", phase: "Production", priority: "high", estimatedHours: 4, relativeDay: 17 },
            { title: "Frontend development", phase: "Production", priority: "high", estimatedHours: 24, relativeDay: 18 },
            { title: "CMS integration", phase: "Production", priority: "medium", estimatedHours: 8, relativeDay: 25 },
            { title: "Content migration", phase: "Production", priority: "medium", estimatedHours: 6, relativeDay: 28 },
            { title: "QA & testing", phase: "Production", priority: "high", estimatedHours: 6, relativeDay: 32 },

            // Admin
            { title: "Launch & deployment", phase: "Admin", priority: "urgent", estimatedHours: 4, relativeDay: 35 },
            { title: "Post-launch support", phase: "Admin", priority: "medium", estimatedHours: 4, relativeDay: 36 },
        ],
    },
    {
        id: "social-campaign",
        name: "Social Media Campaign",
        description: "Paid and organic social media campaign",
        icon: "📱",
        tasks: [
            // Strategy
            { title: "Campaign strategy & goals", phase: "Strategy", priority: "high", estimatedHours: 3, relativeDay: 0 },
            { title: "Audience targeting research", phase: "Strategy", priority: "high", estimatedHours: 3, relativeDay: 1 },
            { title: "Content calendar planning", phase: "Strategy", priority: "medium", estimatedHours: 4, relativeDay: 2 },

            // Creative
            { title: "Creative concepts development", phase: "Creative", priority: "high", estimatedHours: 6, relativeDay: 4 },
            { title: "Static post designs", phase: "Creative", priority: "medium", estimatedHours: 8, relativeDay: 6 },
            { title: "Video/Reels content", phase: "Creative", priority: "medium", estimatedHours: 10, relativeDay: 8 },
            { title: "Copy & captions", phase: "Creative", priority: "medium", estimatedHours: 4, relativeDay: 10 },

            // Production
            { title: "Ad setup & targeting", phase: "Production", priority: "high", estimatedHours: 4, relativeDay: 12 },
            { title: "Campaign launch", phase: "Production", priority: "urgent", estimatedHours: 2, relativeDay: 14 },
            { title: "Weekly performance monitoring", phase: "Production", priority: "medium", estimatedHours: 8, relativeDay: 15 },

            // Admin
            { title: "Campaign analysis & report", phase: "Admin", priority: "medium", estimatedHours: 4, relativeDay: 28 },
        ],
    },
    {
        id: "brand-identity",
        name: "Brand Identity",
        description: "Complete brand identity development",
        icon: "✨",
        tasks: [
            // Strategy
            { title: "Brand discovery workshop", phase: "Strategy", priority: "high", estimatedHours: 4, relativeDay: 0 },
            { title: "Brand audit & competitive review", phase: "Strategy", priority: "high", estimatedHours: 6, relativeDay: 1 },
            { title: "Brand strategy & positioning", phase: "Strategy", priority: "high", estimatedHours: 8, relativeDay: 4 },
            { title: "Brand architecture", phase: "Strategy", priority: "medium", estimatedHours: 4, relativeDay: 7 },

            // Creative
            { title: "Logo concept exploration", phase: "Creative", priority: "high", estimatedHours: 12, relativeDay: 10 },
            { title: "Color palette development", phase: "Creative", priority: "high", estimatedHours: 4, relativeDay: 14 },
            { title: "Typography selection", phase: "Creative", priority: "medium", estimatedHours: 3, relativeDay: 15 },
            { title: "Visual identity system", phase: "Creative", priority: "high", estimatedHours: 8, relativeDay: 17 },
            { title: "Brand voice & messaging", phase: "Creative", priority: "high", estimatedHours: 6, relativeDay: 17 },

            // Production
            { title: "Brand guidelines document", phase: "Production", priority: "high", estimatedHours: 12, relativeDay: 21 },
            { title: "Logo file package", phase: "Production", priority: "medium", estimatedHours: 4, relativeDay: 25 },
            { title: "Template designs", phase: "Production", priority: "medium", estimatedHours: 8, relativeDay: 26 },

            // Revisions
            { title: "Feedback incorporation", phase: "Revisions", priority: "medium", estimatedHours: 6, relativeDay: 28 },

            // Admin
            { title: "Final delivery & handoff", phase: "Admin", priority: "high", estimatedHours: 2, relativeDay: 30 },
        ],
    },
]

export function getTemplateById(id: string): TaskTemplate | undefined {
    return taskTemplates.find((t) => t.id === id)
}

export function calculateTemplateTotals(template: TaskTemplate): {
    totalHours: number
    totalTasks: number
    phaseBreakdown: Record<string, { tasks: number; hours: number }>
} {
    const phaseBreakdown: Record<string, { tasks: number; hours: number }> = {}

    template.tasks.forEach((task) => {
        if (!phaseBreakdown[task.phase]) {
            phaseBreakdown[task.phase] = { tasks: 0, hours: 0 }
        }
        phaseBreakdown[task.phase].tasks += 1
        phaseBreakdown[task.phase].hours += task.estimatedHours
    })

    return {
        totalHours: template.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
        totalTasks: template.tasks.length,
        phaseBreakdown,
    }
}
