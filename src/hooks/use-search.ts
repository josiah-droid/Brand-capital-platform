"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface SearchResult {
  id: string
  type: "deal" | "task" | "time_log"
  title: string
  subtitle?: string
  metadata?: Record<string, unknown>
}

export function useGlobalSearch(query: string, enabled: boolean = true) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["global-search", query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return []

      const searchTerm = `%${query}%`
      const results: SearchResult[] = []

      // Search deals/projects
      const { data: deals } = await supabase
        .from("deals")
        .select("id, name, company_name, stage:stages(name, color), engagement_type, project_value")
        .or(`name.ilike.${searchTerm},company_name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("status", "active")
        .limit(5)

      if (deals) {
        results.push(...deals.map((deal) => ({
          id: deal.id,
          type: "deal" as const,
          title: deal.name,
          subtitle: `${deal.company_name}${deal.stage?.name ? ` • ${deal.stage.name}` : ""}`,
          metadata: {
            stage: deal.stage,
            engagement_type: deal.engagement_type,
            project_value: deal.project_value,
          },
        })))
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, priority, deal:deals(id, name)")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .in("status", ["todo", "in_progress"])
        .limit(5)

      if (tasks) {
        results.push(...tasks.map((task) => ({
          id: task.id,
          type: "task" as const,
          title: task.title,
          subtitle: task.deal?.name ? `Task for ${task.deal.name}` : "General task",
          metadata: {
            status: task.status,
            priority: task.priority,
            deal_id: task.deal?.id,
          },
        })))
      }

      return results
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}
