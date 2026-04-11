import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// OAuth callback for Notion
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=notion_${error ?? 'no_code'}`, req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://invisible-workflow.vercel.app';

  try {
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${appUrl}/api/tools/notion/callback`,
      }),
    });

    const data = await tokenRes.json();
    if (data.error) throw new Error(data.error_description ?? data.error);

    const owner = data.owner?.user ?? data.owner ?? {};
    const userId = (session.user as { id?: string }).id ?? session.user.email;
    const now = new Date().toISOString();

    await storage.upsertToolConnection(userId, 'notion', {
      accessToken: data.access_token,
      accountId: owner.id,
      accountName: owner.name ?? owner.email ?? 'Notion User',
      connected: true,
      connectedAt: now,
      lastSyncAt: now,
    });

    return NextResponse.redirect(new URL('/?connected=notion', req.url));
  } catch (err) {
    console.error('Notion OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
