import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const dealUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  stage_id: z.string().uuid().optional(),
  status: z.enum(["active", "closed_won", "closed_lost", "on_hold"]).optional(),
  valuation: z.number().optional().nullable(),
  investment_amount: z.number().optional().nullable(),
  equity_percentage: z.number().min(0).max(100).optional().nullable(),
  probability_to_close: z.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional().nullable(),
  actual_close_date: z.string().optional().nullable(),
  lead_partner_id: z.string().uuid().optional().nullable(),
  industry: z.string().optional().nullable(),
  deal_source: z.string().optional().nullable(),
})

// GET /api/deals/[id] - Get a single deal with all relations
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
    .from("deals")
    .select(`
      *,
      stage:stages(*),
      lead_partner:profiles!deals_lead_partner_id_fkey(*),
      created_by:profiles!deals_created_by_id_fkey(*),
      members:deal_members(
        id,
        role,
        added_at,
        user:profiles(*)
      ),
      tasks:tasks(
        *,
        assignee:profiles(id, full_name, avatar_url)
      ),
      time_logs:time_logs(
        *,
        user:profiles(id, full_name)
      ),
      notes:deal_notes(
        *,
        user:profiles(id, full_name, avatar_url)
      ),
      activities:deal_activities(
        *,
        user:profiles(id, full_name)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/deals/[id] - Update a deal
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
    const validatedData = dealUpdateSchema.parse(body)

    const { data, error } = await supabase
      .from("deals")
      .update(validatedData)
      .eq("id", id)
      .select()
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

// DELETE /api/deals/[id] - Soft delete (set status to closed_lost)
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

  // Check user role (only admin can delete)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can delete deals" },
      { status: 403 }
    )
  }

  const { id } = await params

  const { error } = await supabase
    .from("deals")
    .update({ status: "closed_lost" })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
