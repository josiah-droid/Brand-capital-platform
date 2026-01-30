-- ============================================
-- BRANDCAPITAL DEAL MANAGEMENT PLATFORM
-- Migration 003: Brand Positioning Schema
-- Transforms from VC/Finance to Brand Consulting
-- ============================================

-- ============================================
-- UPDATE DEALS TABLE
-- ============================================

-- Add new brand positioning fields
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS engagement_type TEXT DEFAULT 'project' CHECK (engagement_type IN ('project', 'retainer', 'pitch')),
ADD COLUMN IF NOT EXISTS project_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS budget DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS hours_budgeted DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS client_industry TEXT,
ADD COLUMN IF NOT EXISTS client_size TEXT CHECK (client_size IN ('startup', 'small', 'medium', 'enterprise', NULL)),
ADD COLUMN IF NOT EXISTS deliverables TEXT,
ADD COLUMN IF NOT EXISTS win_likelihood INTEGER DEFAULT 50 CHECK (win_likelihood >= 0 AND win_likelihood <= 100);

-- Migrate existing data (if any)
UPDATE public.deals
SET project_value = investment_amount,
    win_likelihood = COALESCE(probability_to_close, 50)
WHERE investment_amount IS NOT NULL OR probability_to_close IS NOT NULL;

-- Rename company_name to client_name for clarity (optional - keeping for now as it works)
-- The field company_name represents the client company

-- Drop old finance-specific columns (optional - commenting out to preserve data)
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS investment_amount;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS valuation;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS equity_percentage;
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS probability_to_close;

-- Rename lead_partner_id to account_lead_id for brand terminology
-- (Keeping the column but we'll use different terminology in the UI)

-- ============================================
-- UPDATE DEFAULT PIPELINE STAGES
-- For new companies, use brand-appropriate stages
-- ============================================

-- Note: Existing stages won't be changed automatically
-- This updates the useCreateCompany hook's default stages

-- ============================================
-- ADD INDEXES FOR NEW FIELDS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deals_engagement_type ON public.deals(engagement_type);
CREATE INDEX IF NOT EXISTS idx_deals_client_industry ON public.deals(client_industry);
CREATE INDEX IF NOT EXISTS idx_deals_start_date ON public.deals(start_date);
CREATE INDEX IF NOT EXISTS idx_deals_end_date ON public.deals(end_date);

-- ============================================
-- UPDATE VIEWS
-- ============================================

DROP VIEW IF EXISTS public.deal_time_summary;

CREATE VIEW public.deal_time_summary AS
SELECT
    d.id AS deal_id,
    d.name AS deal_name,
    d.company_name AS client_name,
    d.company_id,
    d.engagement_type,
    d.project_value,
    d.budget,
    d.hours_budgeted,
    COALESCE(SUM(tl.hours), 0) AS total_hours,
    COALESCE(SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END), 0) AS billable_hours,
    COUNT(DISTINCT tl.user_id) AS team_members_logged,
    COALESCE(SUM(tl.hours * COALESCE(tl.hourly_rate_at_time, 0)), 0) AS total_cost,
    CASE
        WHEN d.hours_budgeted > 0 THEN
            ROUND((COALESCE(SUM(tl.hours), 0) / d.hours_budgeted * 100)::numeric, 1)
        ELSE 0
    END AS budget_utilization_pct
FROM public.deals d
LEFT JOIN public.time_logs tl ON tl.deal_id = d.id
GROUP BY d.id, d.name, d.company_name, d.company_id, d.engagement_type, d.project_value, d.budget, d.hours_budgeted;
