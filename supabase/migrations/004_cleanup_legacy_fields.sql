-- ============================================
-- BRANDCAPITAL DEAL MANAGEMENT PLATFORM
-- Migration 004: Clean Up Legacy Fields
-- Updates views to use brand positioning fields
-- ============================================

-- ============================================
-- UPDATE PIPELINE SUMMARY VIEW
-- Use project_value and win_likelihood instead of legacy fields
-- ============================================

DROP VIEW IF EXISTS public.pipeline_summary;

CREATE VIEW public.pipeline_summary AS
SELECT
    s.id AS stage_id,
    s.name AS stage_name,
    s.color,
    s.position,
    s.company_id,
    COUNT(d.id)::INTEGER AS deal_count,
    COALESCE(SUM(d.project_value), 0) AS total_value,
    COALESCE(AVG(d.win_likelihood), 0)::INTEGER AS avg_win_likelihood,
    -- Weighted pipeline value (value * win likelihood)
    COALESCE(SUM(d.project_value * d.win_likelihood / 100), 0) AS weighted_value
FROM public.stages s
LEFT JOIN public.deals d ON d.stage_id = s.id AND d.status = 'active'
GROUP BY s.id, s.name, s.color, s.position, s.company_id
ORDER BY s.position;

-- ============================================
-- UPDATE USER TIME SUMMARY VIEW
-- ============================================

DROP VIEW IF EXISTS public.user_time_summary;

CREATE VIEW public.user_time_summary AS
SELECT
    p.id AS user_id,
    p.full_name,
    DATE_TRUNC('week', tl.date::DATE)::DATE AS week_start,
    COALESCE(SUM(tl.hours), 0) AS total_hours,
    COALESCE(SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END), 0) AS billable_hours,
    COALESCE(SUM(tl.hours * COALESCE(tl.hourly_rate_at_time, 0)), 0) AS total_value
FROM public.profiles p
LEFT JOIN public.time_logs tl ON tl.user_id = p.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.full_name, DATE_TRUNC('week', tl.date::DATE);

-- ============================================
-- CREATE DEAL ANALYTICS VIEW
-- New view for reporting dashboard
-- ============================================

DROP VIEW IF EXISTS public.deal_analytics;

CREATE VIEW public.deal_analytics AS
SELECT
    d.id AS deal_id,
    d.name AS deal_name,
    d.company_name AS client_name,
    d.engagement_type,
    d.client_industry,
    d.client_size,
    d.project_value,
    d.budget,
    d.hours_budgeted,
    d.win_likelihood,
    d.status,
    d.company_id,
    s.name AS stage_name,
    s.color AS stage_color,
    s.is_terminal,
    p.full_name AS lead_partner_name,
    d.start_date,
    d.end_date,
    d.created_at,
    -- Calculate duration in days
    CASE
        WHEN d.end_date IS NOT NULL AND d.start_date IS NOT NULL THEN
            (d.end_date::DATE - d.start_date::DATE)
        ELSE NULL
    END AS duration_days,
    -- Time tracking
    COALESCE(ts.total_hours, 0) AS total_hours_logged,
    COALESCE(ts.billable_hours, 0) AS billable_hours_logged,
    COALESCE(ts.total_cost, 0) AS total_cost,
    -- Budget utilization
    CASE
        WHEN d.hours_budgeted > 0 THEN
            ROUND((COALESCE(ts.total_hours, 0) / d.hours_budgeted * 100)::NUMERIC, 1)
        ELSE 0
    END AS budget_utilization_pct,
    -- Profit margin (if we have both value and cost)
    CASE
        WHEN d.project_value > 0 AND ts.total_cost > 0 THEN
            ROUND(((d.project_value - ts.total_cost) / d.project_value * 100)::NUMERIC, 1)
        ELSE NULL
    END AS profit_margin_pct
FROM public.deals d
JOIN public.stages s ON s.id = d.stage_id
LEFT JOIN public.profiles p ON p.id = d.lead_partner_id
LEFT JOIN (
    SELECT
        deal_id,
        SUM(hours) AS total_hours,
        SUM(CASE WHEN log_type = 'billable' THEN hours ELSE 0 END) AS billable_hours,
        SUM(hours * COALESCE(hourly_rate_at_time, 0)) AS total_cost
    FROM public.time_logs
    GROUP BY deal_id
) ts ON ts.deal_id = d.id;

-- ============================================
-- CREATE TEAM UTILIZATION VIEW
-- For team performance reporting
-- ============================================

DROP VIEW IF EXISTS public.team_utilization;

CREATE VIEW public.team_utilization AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.role,
    p.hourly_rate,
    p.company_id,
    COUNT(DISTINCT dm.deal_id) AS active_deals,
    COALESCE(SUM(tl.hours), 0) AS total_hours_30d,
    COALESCE(SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END), 0) AS billable_hours_30d,
    CASE
        WHEN SUM(tl.hours) > 0 THEN
            ROUND((SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END) / SUM(tl.hours) * 100)::NUMERIC, 1)
        ELSE 0
    END AS billable_rate_pct,
    COALESCE(SUM(tl.hours * COALESCE(tl.hourly_rate_at_time, p.hourly_rate, 0)), 0) AS revenue_generated_30d
FROM public.profiles p
LEFT JOIN public.deal_members dm ON dm.user_id = p.id
LEFT JOIN public.deals d ON d.id = dm.deal_id AND d.status = 'active'
LEFT JOIN public.time_logs tl ON tl.user_id = p.id
    AND tl.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.is_active = TRUE
GROUP BY p.id, p.full_name, p.role, p.hourly_rate, p.company_id;

-- ============================================
-- CREATE WIN/LOSS ANALYTICS VIEW
-- For tracking deal outcomes
-- ============================================

DROP VIEW IF EXISTS public.deal_outcomes;

CREATE VIEW public.deal_outcomes AS
SELECT
    d.company_id,
    DATE_TRUNC('month', d.updated_at)::DATE AS month,
    d.engagement_type,
    d.client_industry,
    d.client_size,
    COUNT(*) FILTER (WHERE d.status = 'closed_won') AS deals_won,
    COUNT(*) FILTER (WHERE d.status = 'closed_lost') AS deals_lost,
    COUNT(*) FILTER (WHERE d.status IN ('closed_won', 'closed_lost')) AS total_closed,
    COALESCE(SUM(d.project_value) FILTER (WHERE d.status = 'closed_won'), 0) AS revenue_won,
    COALESCE(SUM(d.project_value) FILTER (WHERE d.status = 'closed_lost'), 0) AS revenue_lost,
    CASE
        WHEN COUNT(*) FILTER (WHERE d.status IN ('closed_won', 'closed_lost')) > 0 THEN
            ROUND((COUNT(*) FILTER (WHERE d.status = 'closed_won')::NUMERIC /
                   COUNT(*) FILTER (WHERE d.status IN ('closed_won', 'closed_lost')) * 100), 1)
        ELSE 0
    END AS win_rate_pct
FROM public.deals d
WHERE d.status IN ('closed_won', 'closed_lost')
GROUP BY d.company_id, DATE_TRUNC('month', d.updated_at), d.engagement_type, d.client_industry, d.client_size;

-- ============================================
-- ADD INDEXES FOR NEW ANALYTICS QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deals_status_updated ON public.deals(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_deals_company_status ON public.deals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON public.time_logs(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON public.time_logs(user_id, date);

-- ============================================
-- NOTE: Legacy column cleanup
-- These columns are kept for backwards compatibility but can be removed later:
-- - investment_amount (use project_value)
-- - probability_to_close (use win_likelihood)
-- - expected_close_date (use end_date)
-- - valuation (not used in brand positioning)
-- - equity_percentage (not used in brand positioning)
--
-- To remove them later, run:
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS investment_amount;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS valuation;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS equity_percentage;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS probability_to_close;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS expected_close_date;
-- ============================================
