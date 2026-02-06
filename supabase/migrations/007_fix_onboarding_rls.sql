-- ============================================
-- Fix Onboarding RLS Policies
-- Allow users to update their own company_id during onboarding
-- ============================================

-- The profile update policy is likely too restrictive
-- Users need to be able to set their company_id when creating/joining a company

-- Drop and recreate the profile update policy if needed
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Also ensure company creation works
DROP POLICY IF EXISTS "Allow company creation" ON public.companies;

CREATE POLICY "Allow company creation"
    ON public.companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Ensure stages can be created by any authenticated user 
-- (during company onboarding, the user creates stages for their new company)
DROP POLICY IF EXISTS "Admins can manage stages" ON public.stages;
DROP POLICY IF EXISTS "Users can create stages for own company" ON public.stages;

CREATE POLICY "View stages in own company"
    ON public.stages FOR SELECT
    TO authenticated
    USING (company_id = public.get_user_company(auth.uid()) OR company_id IS NULL);

-- Allow insert during onboarding (before user's company_id is set)
CREATE POLICY "Users can create stages for own company"
    ON public.stages FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update stages"
    ON public.stages FOR UPDATE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can delete stages"
    ON public.stages FOR DELETE
    TO authenticated
    USING (
        company_id = public.get_user_company(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    );
