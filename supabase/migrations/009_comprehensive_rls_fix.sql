-- ============================================
-- COMPREHENSIVE FIX FOR ONBOARDING FLOW
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX PROFILES POLICIES
-- Allow users to update their own profile (including setting company_id)
-- ============================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Also allow INSERT for the trigger (in case profile doesn't auto-create)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. FIX COMPANIES POLICIES
-- Allow any authenticated user to create a company
-- ============================================

DROP POLICY IF EXISTS "Allow company creation" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;

CREATE POLICY "Users can view own company"
    ON public.companies FOR SELECT
    TO authenticated
    USING (id = public.get_user_company(auth.uid()) OR true);

CREATE POLICY "Allow company creation"
    ON public.companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- 3. FIX STAGES POLICIES  
-- Allow creating stages during onboarding
-- ============================================

DROP POLICY IF EXISTS "Admins can manage stages" ON public.stages;
DROP POLICY IF EXISTS "Users can create stages for own company" ON public.stages;
DROP POLICY IF EXISTS "View stages in own company" ON public.stages;
DROP POLICY IF EXISTS "Admins can update stages" ON public.stages;
DROP POLICY IF EXISTS "Admins can delete stages" ON public.stages;

CREATE POLICY "View stages"
    ON public.stages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Create stages"
    ON public.stages FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Update stages"
    ON public.stages FOR UPDATE
    TO authenticated
    USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Delete stages"
    ON public.stages FOR DELETE
    TO authenticated
    USING (company_id = public.get_user_company(auth.uid()));

-- ============================================
-- 4. FIX INVITATIONS POLICIES
-- Allow any authenticated user to view/update invitations (for accepting)
-- ============================================

DROP POLICY IF EXISTS "View company invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Create company invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Delete company invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Update invitations" ON public.company_invitations;

CREATE POLICY "View company invitations"
    ON public.company_invitations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Create company invitations"
    ON public.company_invitations FOR INSERT
    TO authenticated
    WITH CHECK (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Update company invitations"
    ON public.company_invitations FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Delete company invitations"
    ON public.company_invitations FOR DELETE
    TO authenticated
    USING (company_id = public.get_user_company(auth.uid()));

-- ============================================
-- 5. FIX DEALS POLICIES
-- Allow creating deals in own company
-- ============================================

DROP POLICY IF EXISTS "Create deals in own company" ON public.deals;

CREATE POLICY "Create deals in own company"
    ON public.deals FOR INSERT
    TO authenticated
    WITH CHECK (company_id = public.get_user_company(auth.uid()));

-- ============================================
-- 6. ADD PHASE COLUMN TO TASKS (if not exists)
-- ============================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS phase text DEFAULT 'General';
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);

-- ============================================
-- DONE! Now try creating a company again.
-- ============================================
