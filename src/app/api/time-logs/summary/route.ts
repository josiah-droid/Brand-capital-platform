import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/time-logs/summary - Get time log summaries
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const view = searchParams.get("view") || "user" // 'user' or 'deal'
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  // Check role for permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (view === "user") {
    // User time summary view
    let query = supabase.from("user_time_summary").select("*")

    if (profile?.role === "associate") {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } else if (view === "deal") {
    // Deal time summary view
    const { data, error } = await supabase.from("deal_time_summary").select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
}
