import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    // Exchange code for tokens
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
    if (!data.ok) {
      throw new Error(data.error ?? 'Slack OAuth failed');
    }

    // Get bot info
    const authedUser = data.authed_user ?? data.team;

    await prisma.toolConnection.upsert({
      where: {
        userId_toolId: { userId: session.user.id ?? '', toolId: 'slack' },
      },
      create: {
        userId: session.user.id ?? '',
        toolId: 'slack',
        accessToken: data.access_token,
        accountId: data.team?.id ?? authedUser?.id,
        accountName: data.team?.name ?? 'Slack Workspace',
        connected: true,
        connectedAt: new Date(),
      },
      update: {
        accessToken: data.access_token,
        accountId: data.team?.id ?? authedUser?.id,
        accountName: data.team?.name ?? 'Slack Workspace',
        connected: true,
        connectedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL('/?connected=slack', req.url));
  } catch (err) {
    console.error('Slack OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
