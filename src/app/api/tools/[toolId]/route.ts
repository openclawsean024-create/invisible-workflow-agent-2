import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { google } from '@temporalio/activity';

// GET /api/tools/[toolId]/status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolId } = await params;
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: session.user.id ?? '', toolId } },
  });

  return NextResponse.json({
    connected: connection?.connected ?? false,
    account: connection?.accountName ?? null,
    connectedAt: connection?.connectedAt?.toISOString() ?? null,
    lastSync: connection?.lastSyncAt?.toISOString() ?? null,
  });
}

// POST /api/tools/[toolId]/connect - Start OAuth flow
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const oauthUrls: Record<string, string> = {
    'google-calendar': `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${appUrl}/api/tools/google-calendar/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`,
    slack: `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,channels:read,groups:read,im:read,im:write,mpim:write&redirect_uri=${appUrl}/api/tools/slack/callback&user_scope=identity.basic,identity.email`,
    notion: `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${appUrl}/api/tools/notion/callback`,
    trello: `https://trello.com/1/authorize?expiration=never&name=InvisibleWorkflow&scope=read,write&response_type=code&key=${process.env.TRELLO_API_KEY}&redirect_uri=${appUrl}/api/tools/trello/callback`,
    github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user&redirect_uri=${appUrl}/api/tools/github/callback`,
  };

  const url = oauthUrls[toolId];
  if (!url) {
    return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
  }

  return NextResponse.json({ authUrl: url });
}

// DELETE /api/tools/[toolId]/connect - Disconnect tool
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolId } = await params;
  await prisma.toolConnection.deleteMany({
    where: { user: { email: session.user.email }, toolId },
  });

  return NextResponse.json({ success: true });
}
