-- ============================================
-- BRANDCAPITAL DEAL MANAGEMENT PLATFORM
-- Migration 002: Add Companies/Organizations
-- ============================================

-- ============================================
-- COMPANIES TABLE
-- ============================================

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    logo_url TEXT,

    -- Settings
    default_hourly_rate DECIMAL(10, 2) DEFAULT 0,

    -- Invite code for joining
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPDATE PROFILES - Add company relationship
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================
-- UPDATE DEALS - Add company relationship
-- ============================================

ALTER TABLE public.deals
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================
-- UPDATE TASKS - Add company relationship
-- ============================================

ALTER TABLE public.tasks
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================
-- UPDATE TIME_LOGS - Add company relationship
-- ============================================

ALTER TABLE public.time_logs
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================
-- UPDATE STAGES - Add company relationship
-- (Each company can have their own pipeline stages)
-- ============================================

ALTER TABLE public.stages
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================
-- COMPANY INVITATIONS
-- ============================================

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE public.company_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'associate',
    invited_by_id UUID REFERENCES public.profiles(id),
    status invitation_status DEFAULT 'pending',
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, email)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_deals_company ON public.deals(company_id);
CREATE INDEX idx_tasks_company ON public.tasks(company_id);
CREATE INDEX idx_time_logs_company ON public.time_logs(company_id);
CREATE INDEX idx_stages_company ON public.stages(company_id);
CREATE INDEX idx_invitations_email ON public.company_invitations(email);
CREATE INDEX idx_invitations_token ON public.company_invitations(token);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's company ID
CREATE OR REPLACE FUNCTION public.get_user_company(user_id UUID)
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user belongs to company
CREATE OR REPLACE FUNCTION public.user_in_company(user_uuid UUID, company_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_uuid AND company_id = company_uuid
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- ENABLE RLS ON NEW TABLE
-- ============================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR COMPANIES
-- ============================================

-- Users can view their own company
CREATE POLICY "Users can view own company"
    ON public.companies FOR SELECT
    TO authenticated
    USING (id = public.get_user_company(auth.uid()));

-- Admins can update company settings
CREATE POLICY "Admins can update company"
    ON public.companies FOR UPDATE
    TO authenticated
    USING (
        id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    );

-- Allow insert for new company creation (during signup)
CREATE POLICY "Allow company creation"
    ON public.companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- RLS POLICIES FOR INVITATIONS
-- ============================================

-- Admins/Partners can view invitations for their company
CREATE POLICY "View company invitations"
    ON public.company_invitations FOR SELECT
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) IN ('admin', 'partner')
    );

-- Admins/Partners can create invitations
CREATE POLICY "Create company invitations"
    ON public.company_invitations FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) IN ('admin', 'partner')
    );

-- Admins can delete invitations
CREATE POLICY "Delete company invitations"
    ON public.company_invitations FOR DELETE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    );

-- ============================================
-- UPDATE EXISTING RLS POLICIES
-- (Add company scoping)
-- ============================================

-- Drop old policies that need updating
DROP POLICY IF EXISTS "Admins see all deals" ON public.deals;
DROP POLICY IF EXISTS "Partners and Associates see their deals" ON public.deals;
DROP POLICY IF EXISTS "Partners and Admins can create deals" ON public.deals;
DROP POLICY IF EXISTS "Partners can update their deals, Admins all" ON public.deals;

-- New company-scoped deal policies
CREATE POLICY "View deals in own company"
    ON public.deals FOR SELECT
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND (
            public.get_user_role(auth.uid()) = 'admin'
            OR public.is_deal_member(id, auth.uid())
        )
    );

CREATE POLICY "Create deals in own company"
    ON public.deals FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) IN ('admin', 'partner')
    );

CREATE POLICY "Update deals in own company"
    ON public.deals FOR UPDATE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND (
            public.get_user_role(auth.uid()) = 'admin'
            OR (
                public.get_user_role(auth.uid()) = 'partner'
                AND public.is_deal_member(id, auth.uid())
            )
        )
    );

-- Update stages policy for company scoping
DROP POLICY IF EXISTS "Stages are viewable by all" ON public.stages;
DROP POLICY IF EXISTS "Only admins can modify stages" ON public.stages;

CREATE POLICY "View stages in own company"
    ON public.stages FOR SELECT
    TO authenticated
    USING (company_id = public.get_user_company(auth.uid()) OR company_id IS NULL);

CREATE POLICY "Admins can manage stages"
    ON public.stages FOR ALL
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    );

-- Update tasks policy for company scoping
DROP POLICY IF EXISTS "View tasks for accessible deals or assigned" ON public.tasks;
DROP POLICY IF EXISTS "Create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update own or assigned tasks" ON public.tasks;

CREATE POLICY "View tasks in own company"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND (
            public.get_user_role(auth.uid()) = 'admin'
            OR assignee_id = auth.uid()
            OR created_by_id = auth.uid()
            OR (deal_id IS NOT NULL AND public.is_deal_member(deal_id, auth.uid()))
        )
    );

CREATE POLICY "Create tasks in own company"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id = public.get_user_company(auth.uid())
        AND created_by_id = auth.uid()
    );

CREATE POLICY "Update tasks in own company"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND (
            public.get_user_role(auth.uid()) = 'admin'
            OR assignee_id = auth.uid()
            OR created_by_id = auth.uid()
        )
    );

-- Update time_logs policy for company scoping
DROP POLICY IF EXISTS "View own time logs" ON public.time_logs;
DROP POLICY IF EXISTS "Create own time logs" ON public.time_logs;
DROP POLICY IF EXISTS "Update own time logs" ON public.time_logs;
DROP POLICY IF EXISTS "Delete own time logs" ON public.time_logs;

CREATE POLICY "View time logs in own company"
    ON public.time_logs FOR SELECT
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND (
            user_id = auth.uid()
            OR public.get_user_role(auth.uid()) = 'admin'
            OR (
                public.get_user_role(auth.uid()) = 'partner'
                AND deal_id IS NOT NULL
                AND public.is_deal_member(deal_id, auth.uid())
            )
        )
    );

CREATE POLICY "Create time logs in own company"
    ON public.time_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id = public.get_user_company(auth.uid())
        AND user_id = auth.uid()
    );

CREATE POLICY "Update own time logs in company"
    ON public.time_logs FOR UPDATE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND user_id = auth.uid()
    );

CREATE POLICY "Delete own time logs in company"
    ON public.time_logs FOR DELETE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND user_id = auth.uid()
    );

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_companies
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- UPDATE VIEWS FOR COMPANY SCOPING
-- ============================================

-- Drop and recreate views with company context
DROP VIEW IF EXISTS public.pipeline_summary;
DROP VIEW IF EXISTS public.deal_time_summary;

-- Note: Views in Postgres don't support RLS directly,
-- so we'll handle company filtering in the application layer
-- or use security barrier views

CREATE VIEW public.pipeline_summary AS
SELECT
    s.id AS stage_id,
    s.name AS stage_name,
    s.color,
    s.position,
    s.company_id,
    COUNT(d.id) AS deal_count,
    COALESCE(SUM(d.investment_amount), 0) AS total_investment,
    COALESCE(AVG(d.probability_to_close), 0) AS avg_probability
FROM public.stages s
LEFT JOIN public.deals d ON d.stage_id = s.id AND d.status = 'active'
GROUP BY s.id, s.name, s.color, s.position, s.company_id
ORDER BY s.position;

CREATE VIEW public.deal_time_summary AS
SELECT
    d.id AS deal_id,
    d.name AS deal_name,
    d.company_name,
    d.company_id,
    COALESCE(SUM(tl.hours), 0) AS total_hours,
    COALESCE(SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END), 0) AS billable_hours,
    COUNT(DISTINCT tl.user_id) AS team_members_logged,
    COALESCE(SUM(tl.hours * COALESCE(tl.hourly_rate_at_time, 0)), 0) AS total_cost
FROM public.deals d
LEFT JOIN public.time_logs tl ON tl.deal_id = d.id
GROUP BY d.id, d.name, d.company_name, d.company_id;
