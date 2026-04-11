import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// OAuth callback for Trello
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') ?? searchParams.get('token');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=trello_${error ?? 'no_code'}`, req.url));
  }

  try {
    const token = code;
    const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`);
    const member = await memberRes.json();

    const userId = (session.user as { id?: string }).id ?? session.user.email;
    const now = new Date().toISOString();

    await storage.upsertToolConnection(userId, 'trello', {
      accessToken: token,
      accountId: member.id,
      accountName: member.fullName ?? member.username ?? 'Trello User',
      connected: true,
      connectedAt: now,
      lastSyncAt: now,
    });

    return NextResponse.redirect(new URL('/?connected=trello', req.url));
  } catch (err) {
    console.error('Trello OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
