-- ============================================
-- Fix RLS policy for deal creation
-- Allow all roles in a company to create deals
-- ============================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Create deals in own company" ON public.deals;

-- Create a more permissive policy that allows all users in a company to create deals
CREATE POLICY "Create deals in own company"
    ON public.deals FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id = public.get_user_company(auth.uid())
    );

-- Note: If you're still getting errors, run this query to check your profile:
-- SELECT id, email, full_name, role, company_id FROM profiles WHERE id = auth.uid();
-- 
-- If company_id is NULL, you need to join a company first through onboarding
-- or manually update your profile:
-- UPDATE profiles SET company_id = 'your-company-uuid' WHERE id = 'your-user-uuid';
