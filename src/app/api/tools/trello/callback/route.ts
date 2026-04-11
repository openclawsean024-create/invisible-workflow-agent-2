import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
    // Get access token from Trello
    const tokenRes = await fetch('https://trello.com/1/token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    // Trello uses token directly from the authorization page
    const token = code;

    // Get Trello member info
    const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`);
    const member = await memberRes.json();

    await prisma.toolConnection.upsert({
      where: {
        userId_toolId: { userId: session.user.id ?? '', toolId: 'trello' },
      },
      create: {
        userId: session.user.id ?? '',
        toolId: 'trello',
        accessToken: token,
        accountId: member.id,
        accountName: member.fullName ?? member.username ?? 'Trello User',
        connected: true,
        connectedAt: new Date(),
      },
      update: {
        accessToken: token,
        accountId: member.id,
        accountName: member.fullName ?? member.username ?? 'Trello User',
        connected: true,
        connectedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL('/?connected=trello', req.url));
  } catch (err) {
    console.error('Trello OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
