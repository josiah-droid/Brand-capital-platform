-- ============================================
-- BRANDCAPITAL DEAL MANAGEMENT PLATFORM
-- Initial Schema Migration
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'partner', 'associate');
CREATE TYPE deal_status AS ENUM ('active', 'closed_won', 'closed_lost', 'on_hold');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'completed');
CREATE TYPE time_log_type AS ENUM ('billable', 'non_billable', 'internal');

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'associate',
    hourly_rate DECIMAL(10, 2) DEFAULT 0, -- For billable calculations
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PIPELINE STAGES
-- ============================================

CREATE TABLE public.stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6B7280', -- Hex color for UI
    position INTEGER NOT NULL, -- Order in pipeline
    is_terminal BOOLEAN DEFAULT false, -- True for "Closed" stages
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default stages for deal pipeline
INSERT INTO public.stages (name, description, color, position, is_terminal) VALUES
    ('Sourcing', 'Initial deal identification and outreach', '#3B82F6', 1, false),
    ('Screening', 'Preliminary evaluation and fit assessment', '#8B5CF6', 2, false),
    ('Due Diligence', 'Deep-dive analysis and verification', '#F59E0B', 3, false),
    ('Negotiation', 'Term sheet and deal structuring', '#EF4444', 4, false),
    ('Closed - Won', 'Successfully closed deals', '#10B981', 5, true),
    ('Passed', 'Deals we declined or lost', '#6B7280', 6, true);

-- ============================================
-- DEALS
-- ============================================

CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core Information
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT,

    -- Pipeline
    stage_id UUID NOT NULL REFERENCES public.stages(id),
    status deal_status DEFAULT 'active',

    -- Financials
    valuation DECIMAL(15, 2), -- Company valuation
    investment_amount DECIMAL(15, 2), -- Our potential investment
    equity_percentage DECIMAL(5, 2), -- Percentage stake

    -- Deal Metrics
    probability_to_close INTEGER DEFAULT 50 CHECK (probability_to_close >= 0 AND probability_to_close <= 100),
    expected_close_date DATE,
    actual_close_date DATE,

    -- Ownership
    lead_partner_id UUID REFERENCES public.profiles(id),
    created_by_id UUID NOT NULL REFERENCES public.profiles(id),

    -- Industry/Categorization
    industry TEXT,
    deal_source TEXT, -- Where did this deal come from?

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEAL TEAM MEMBERS (Many-to-Many)
-- ============================================

CREATE TABLE public.deal_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'lead', 'member', 'observer'
    added_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(deal_id, user_id)
);

-- ============================================
-- TASKS
-- ============================================

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Task Details
    title TEXT NOT NULL,
    description TEXT,

    -- Linking (task can be linked to deal OR be standalone)
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,

    -- Assignment
    assignee_id UUID REFERENCES public.profiles(id),
    created_by_id UUID NOT NULL REFERENCES public.profiles(id),

    -- Status & Priority
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',

    -- Dates
    due_date DATE,
    completed_at TIMESTAMPTZ,

    -- Time Estimates
    estimated_hours DECIMAL(5, 2),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIME LOGS
-- ============================================

CREATE TABLE public.time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who logged this
    user_id UUID NOT NULL REFERENCES public.profiles(id),

    -- What was worked on (at least one should be set)
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

    -- Time Entry
    date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),

    -- Categorization
    log_type time_log_type DEFAULT 'billable',
    description TEXT NOT NULL,

    -- Billing
    hourly_rate_at_time DECIMAL(10, 2), -- Snapshot of rate when logged

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEAL ACTIVITY LOG (Audit Trail)
-- ============================================

CREATE TABLE public.deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),

    action TEXT NOT NULL, -- 'stage_changed', 'task_added', 'note_added', etc.
    details JSONB, -- Flexible storage for action-specific data

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEAL NOTES/COMMENTS
-- ============================================

CREATE TABLE public.deal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),

    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false, -- Only visible to author if true

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Deals
CREATE INDEX idx_deals_stage ON public.deals(stage_id);
CREATE INDEX idx_deals_lead_partner ON public.deals(lead_partner_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_created_at ON public.deals(created_at DESC);

-- Tasks
CREATE INDEX idx_tasks_deal ON public.tasks(deal_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Time Logs
CREATE INDEX idx_time_logs_user ON public.time_logs(user_id);
CREATE INDEX idx_time_logs_deal ON public.time_logs(deal_id);
CREATE INDEX idx_time_logs_date ON public.time_logs(date DESC);
CREATE INDEX idx_time_logs_user_date ON public.time_logs(user_id, date);

-- Deal Members
CREATE INDEX idx_deal_members_user ON public.deal_members(user_id);
CREATE INDEX idx_deal_members_deal ON public.deal_members(deal_id);

-- Activities
CREATE INDEX idx_deal_activities_deal ON public.deal_activities(deal_id);
CREATE INDEX idx_deal_activities_created ON public.deal_activities(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is deal member
CREATE OR REPLACE FUNCTION public.is_deal_member(deal_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.deal_members
        WHERE deal_id = deal_uuid AND user_id = user_uuid
    ) OR EXISTS (
        SELECT 1 FROM public.deals
        WHERE id = deal_uuid AND (lead_partner_id = user_uuid OR created_by_id = user_uuid)
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- STAGES: Everyone can read, only admins can modify
CREATE POLICY "Stages are viewable by all"
    ON public.stages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can modify stages"
    ON public.stages FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

-- DEALS: Complex access based on role
CREATE POLICY "Admins see all deals"
    ON public.deals FOR SELECT
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Partners and Associates see their deals"
    ON public.deals FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) IN ('partner', 'associate')
        AND public.is_deal_member(id, auth.uid())
    );

CREATE POLICY "Partners and Admins can create deals"
    ON public.deals FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('admin', 'partner')
    );

CREATE POLICY "Partners can update their deals, Admins all"
    ON public.deals FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        OR (
            public.get_user_role(auth.uid()) = 'partner'
            AND public.is_deal_member(id, auth.uid())
        )
    );

-- DEAL MEMBERS: Based on deal access
CREATE POLICY "View deal members if can view deal"
    ON public.deal_members FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        OR public.is_deal_member(deal_id, auth.uid())
    );

CREATE POLICY "Admins and Partners manage deal members"
    ON public.deal_members FOR ALL
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        OR (
            public.get_user_role(auth.uid()) = 'partner'
            AND public.is_deal_member(deal_id, auth.uid())
        )
    );

-- TASKS: Based on deal access or personal tasks
CREATE POLICY "View tasks for accessible deals or assigned"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        OR assignee_id = auth.uid()
        OR created_by_id = auth.uid()
        OR (deal_id IS NOT NULL AND public.is_deal_member(deal_id, auth.uid()))
    );

CREATE POLICY "Create tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Update own or assigned tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        OR assignee_id = auth.uid()
        OR created_by_id = auth.uid()
    );

-- TIME LOGS: Users see their own, Admins/Partners see team
CREATE POLICY "View own time logs"
    ON public.time_logs FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.get_user_role(auth.uid()) = 'admin'
        OR (
            public.get_user_role(auth.uid()) = 'partner'
            AND deal_id IS NOT NULL
            AND public.is_deal_member(deal_id, auth.uid())
        )
    );

CREATE POLICY "Create own time logs"
    ON public.time_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own time logs"
    ON public.time_logs FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Delete own time logs"
    ON public.time_logs FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- DEAL ACTIVITIES: Read based on deal access
CREATE POLICY "View activities for accessible deals"
    ON public.deal_activities FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        OR public.is_deal_member(deal_id, auth.uid())
    );

CREATE POLICY "System can create activities"
    ON public.deal_activities FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- DEAL NOTES: Based on deal access and privacy
CREATE POLICY "View notes for accessible deals"
    ON public.deal_notes FOR SELECT
    TO authenticated
    USING (
        (public.get_user_role(auth.uid()) = 'admin' OR public.is_deal_member(deal_id, auth.uid()))
        AND (NOT is_private OR user_id = auth.uid())
    );

CREATE POLICY "Create notes on accessible deals"
    ON public.deal_notes FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND (
            public.get_user_role(auth.uid()) = 'admin'
            OR public.is_deal_member(deal_id, auth.uid())
        )
    );

-- ============================================
-- TRIGGERS FOR AUTOMATION
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_deals
    BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_time_logs
    BEFORE UPDATE ON public.time_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'associate')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-log deal stage changes
CREATE OR REPLACE FUNCTION public.log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO public.deal_activities (deal_id, user_id, action, details)
        VALUES (
            NEW.id,
            auth.uid(),
            'stage_changed',
            jsonb_build_object(
                'from_stage', OLD.stage_id,
                'to_stage', NEW.stage_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_deal_stage_change
    AFTER UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.log_deal_stage_change();

-- Set task completed_at when status changes to completed
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_task_completion();

-- Snapshot hourly rate when time log is created
CREATE OR REPLACE FUNCTION public.snapshot_hourly_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hourly_rate_at_time IS NULL THEN
        SELECT hourly_rate INTO NEW.hourly_rate_at_time
        FROM public.profiles
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_hourly_rate_snapshot
    BEFORE INSERT ON public.time_logs
    FOR EACH ROW EXECUTE FUNCTION public.snapshot_hourly_rate();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Pipeline summary view
CREATE VIEW public.pipeline_summary AS
SELECT
    s.id AS stage_id,
    s.name AS stage_name,
    s.color,
    s.position,
    COUNT(d.id) AS deal_count,
    COALESCE(SUM(d.investment_amount), 0) AS total_investment,
    COALESCE(AVG(d.probability_to_close), 0) AS avg_probability
FROM public.stages s
LEFT JOIN public.deals d ON d.stage_id = s.id AND d.status = 'active'
GROUP BY s.id, s.name, s.color, s.position
ORDER BY s.position;

-- User time summary view
CREATE VIEW public.user_time_summary AS
SELECT
    tl.user_id,
    p.full_name,
    DATE_TRUNC('week', tl.date) AS week_start,
    SUM(tl.hours) AS total_hours,
    SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END) AS billable_hours,
    SUM(tl.hours * COALESCE(tl.hourly_rate_at_time, 0)) AS total_value
FROM public.time_logs tl
JOIN public.profiles p ON p.id = tl.user_id
GROUP BY tl.user_id, p.full_name, DATE_TRUNC('week', tl.date);

-- Deal time allocation view
CREATE VIEW public.deal_time_summary AS
SELECT
    d.id AS deal_id,
    d.name AS deal_name,
    d.company_name,
    SUM(tl.hours) AS total_hours,
    SUM(CASE WHEN tl.log_type = 'billable' THEN tl.hours ELSE 0 END) AS billable_hours,
    COUNT(DISTINCT tl.user_id) AS team_members_logged,
    SUM(tl.hours * COALESCE(tl.hourly_rate_at_time, 0)) AS total_cost
FROM public.deals d
LEFT JOIN public.time_logs tl ON tl.deal_id = d.id
GROUP BY d.id, d.name, d.company_name;
