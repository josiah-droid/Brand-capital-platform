import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const timeLogUpdateSchema = z.object({
  deal_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hours: z.number().min(0.1).max(24).optional(),
  log_type: z.enum(["billable", "non_billable", "internal"]).optional(),
  description: z.string().min(1).optional(),
})

// GET /api/time-logs/[id] - Get a single time log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      *,
      user:profiles!time_logs_user_id_fkey(*),
      deal:deals(id, name, company_name),
      task:tasks(id, title)
    `)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Time log not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/time-logs/[id] - Update a time log (only own logs)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validatedData = timeLogUpdateSchema.parse(body)

    // Verify ownership
    const { data: existingLog } = await supabase
      .from("time_logs")
      .select("user_id")
      .eq("id", id)
      .single()

    if (existingLog?.user_id !== user.id) {
      return NextResponse.json(
        { error: "Can only update own time logs" },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from("time_logs")
      .update(validatedData)
      .eq("id", id)
      .select(`
        *,
        deal:deals(id, name),
        task:tasks(id, title)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
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

// DELETE /api/time-logs/[id] - Delete a time log (only own logs)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const { data: existingLog } = await supabase
    .from("time_logs")
    .select("user_id")
    .eq("id", id)
    .single()

  if (existingLog?.user_id !== user.id) {
    // Allow admins to delete any time log
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Can only delete own time logs" },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase.from("time_logs").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
