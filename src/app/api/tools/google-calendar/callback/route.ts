import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// OAuth callback for Google Calendar
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=oauth_${error ?? 'no_code'}`, req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${appUrl}/api/tools/google-calendar/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('Token exchange failed');
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // Save/update connection
    await prisma.toolConnection.upsert({
      where: {
        userId_toolId: { userId: session.user.id ?? '', toolId: 'google-calendar' },
      },
      create: {
        userId: session.user.id ?? '',
        toolId: 'google-calendar',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        accountId: userInfo.id,
        accountName: userInfo.email,
        connected: true,
        connectedAt: new Date(),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        accountId: userInfo.id,
        accountName: userInfo.email,
        connected: true,
        connectedAt: new Date(),
      },
    });

    // Also save Gmail connection with same tokens
    await prisma.toolConnection.upsert({
      where: {
        userId_toolId: { userId: session.user.id ?? '', toolId: 'gmail' },
      },
      create: {
        userId: session.user.id ?? '',
        toolId: 'gmail',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        accountId: userInfo.id,
        accountName: userInfo.email,
        connected: true,
        connectedAt: new Date(),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        connected: true,
        connectedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL('/?connected=google-calendar', req.url));
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
