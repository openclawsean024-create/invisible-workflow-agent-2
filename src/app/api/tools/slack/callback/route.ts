import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// OAuth callback for Slack
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=slack_${error ?? 'no_code'}`, req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://invisible-workflow.vercel.app';

  try {
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID ?? '',
        client_secret: process.env.SLACK_CLIENT_SECRET ?? '',
        code,
        redirect_uri: `${appUrl}/api/tools/slack/callback`,
      }),
    });

    const data = await tokenRes.json();
    if (!data.ok) throw new Error(data.error ?? 'Slack OAuth failed');

    const authedUser = data.authed_user ?? data.team;
    const userId = (session.user as { id?: string }).id ?? session.user.email;
    const now = new Date().toISOString();

    await storage.upsertToolConnection(userId, 'slack', {
      accessToken: data.access_token,
      accountId: data.team?.id ?? authedUser?.id,
      accountName: data.team?.name ?? 'Slack Workspace',
      connected: true,
      connectedAt: now,
      lastSyncAt: now,
    });

    return NextResponse.redirect(new URL('/?connected=slack', req.url));
  } catch (err) {
    console.error('Slack OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
