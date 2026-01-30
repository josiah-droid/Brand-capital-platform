import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schema for creating/updating deals
const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  company_name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  stage_id: z.string().uuid("Invalid stage ID"),
  valuation: z.number().optional().nullable(),
  investment_amount: z.number().optional().nullable(),
  equity_percentage: z.number().min(0).max(100).optional().nullable(),
  probability_to_close: z.number().min(0).max(100).default(50),
  expected_close_date: z.string().optional().nullable(),
  lead_partner_id: z.string().uuid().optional().nullable(),
  industry: z.string().optional().nullable(),
  deal_source: z.string().optional().nullable(),
})

// GET /api/deals - List all deals (with optional filters)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const stageId = searchParams.get("stage_id")
  const status = searchParams.get("status") || "active"

  let query = supabase
    .from("deals")
    .select(`
      *,
      stage:stages(*),
      lead_partner:profiles!deals_lead_partner_id_fkey(id, full_name, avatar_url),
      created_by:profiles!deals_created_by_id_fkey(id, full_name),
      members:deal_members(
        id,
        role,
        user:profiles(id, full_name, avatar_url)
      )
    `)
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (stageId) {
    query = query.eq("stage_id", stageId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check user role (only admin/partner can create deals)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role === "associate") {
    return NextResponse.json(
      { error: "Insufficient permissions to create deals" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = dealSchema.parse(body)

    const { data, error } = await supabase
      .from("deals")
      .insert({
        ...validatedData,
        created_by_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-add creator as a deal member
    await supabase.from("deal_members").insert({
      deal_id: data.id,
      user_id: user.id,
      role: "lead",
    })

    // Log activity
    await supabase.from("deal_activities").insert({
      deal_id: data.id,
      user_id: user.id,
      action: "deal_created",
      details: { name: data.name },
    })

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
