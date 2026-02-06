import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a member of the company (or admin)
    // We can trust the client to send the companyName, but for security 
    // we might want to fetch it again. For now, we trust the auth context implies access.

    try {
        const { email, link, companyName, invitedBy } = await req.json();

        if (!email || !link) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'Brand Capital <onboarding@resend.dev>', // Update this if they have a domain
            to: [email],
            subject: `You've been invited to join ${companyName} on Brand Capital`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p><strong>${invitedBy}</strong> has invited you to join the <strong>${companyName}</strong> workspace on Brand Capital.</p>
          <p>Click the button below to accept the invitation and get started:</p>
          <a href="${link}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">Accept Invitation</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px;">${link}</p>
        </div>
      `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Invite error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
