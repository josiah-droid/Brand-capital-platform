import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  status: z.enum(["todo", "in_progress", "blocked", "completed"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.number().optional().nullable(),
})

// GET /api/tasks - List tasks (with optional filters)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const dealId = searchParams.get("deal_id")
  const assigneeId = searchParams.get("assignee_id")
  const status = searchParams.get("status")

  let query = supabase
    .from("tasks")
    .select(`
      *,
      deal:deals(id, name, company_name),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      created_by:profiles!tasks_created_by_id_fkey(id, full_name)
    `)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })

  if (dealId) {
    query = query.eq("deal_id", dealId)
  }

  if (assigneeId) {
    query = query.eq("assignee_id", assigneeId)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = taskSchema.parse(body)

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...validatedData,
        created_by_id: user.id,
      })
      .select(`
        *,
        deal:deals(id, name),
        assignee:profiles!tasks_assignee_id_fkey(id, full_name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity if task is linked to a deal
    if (validatedData.deal_id) {
      await supabase.from("deal_activities").insert({
        deal_id: validatedData.deal_id,
        user_id: user.id,
        action: "task_added",
        details: { task_title: data.title },
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
