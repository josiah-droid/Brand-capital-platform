import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const timeLogSchema = z.object({
  deal_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  hours: z.number().min(0.1).max(24, "Hours must be between 0.1 and 24"),
  log_type: z.enum(["billable", "non_billable", "internal"]).default("billable"),
  description: z.string().min(1, "Description is required"),
})

// GET /api/time-logs - List time logs (with optional filters)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("user_id")
  const dealId = searchParams.get("deal_id")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  let query = supabase
    .from("time_logs")
    .select(`
      *,
      user:profiles!time_logs_user_id_fkey(id, full_name, avatar_url),
      deal:deals(id, name, company_name),
      task:tasks(id, title)
    `)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  // If not admin/partner, only show own time logs
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "associate") {
    query = query.eq("user_id", user.id)
  } else if (userId) {
    query = query.eq("user_id", userId)
  }

  if (dealId) {
    query = query.eq("deal_id", dealId)
  }

  if (startDate) {
    query = query.gte("date", startDate)
  }

  if (endDate) {
    query = query.lte("date", endDate)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/time-logs - Create a new time log
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
    const validatedData = timeLogSchema.parse(body)

    // Validate that at least deal_id or task_id is provided (or neither for general time)
    // This is optional - you might want all time to be unlinked by default

    const { data, error } = await supabase
      .from("time_logs")
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select(`
        *,
        deal:deals(id, name),
        task:tasks(id, title)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity if time logged against a deal
    if (validatedData.deal_id) {
      await supabase.from("deal_activities").insert({
        deal_id: validatedData.deal_id,
        user_id: user.id,
        action: "time_logged",
        details: {
          hours: validatedData.hours,
          description: validatedData.description,
        },
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
