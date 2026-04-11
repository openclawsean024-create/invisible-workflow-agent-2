import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// OAuth callback for GitHub
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=github_${error ?? 'no_code'}`, req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appUrl}/api/tools/github/callback`,
      }),
    });

    const data = await tokenRes.json();
    if (data.error) {
      throw new Error(data.error_description ?? data.error);
    }

    // Get GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    const userInfo = await userRes.json();

    await prisma.toolConnection.upsert({
      where: {
        userId_toolId: { userId: session.user.id ?? '', toolId: 'github' },
      },
      create: {
        userId: session.user.id ?? '',
        toolId: 'github',
        accessToken: data.access_token,
        accountId: String(userInfo.id),
        accountName: userInfo.login ?? 'GitHub User',
        connected: true,
        connectedAt: new Date(),
      },
      update: {
        accessToken: data.access_token,
        accountId: String(userInfo.id),
        accountName: userInfo.login ?? 'GitHub User',
        connected: true,
        connectedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL('/?connected=github', req.url));
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
