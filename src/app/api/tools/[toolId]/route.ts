import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// GET /api/tools/[toolId] - Get tool connection status
// POST /api/tools/[toolId] - Generic tool action (used by callbacks)
// DELETE /api/tools/[toolId] - Generic tool disconnect
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolId } = await params;
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const connection = await storage.getToolConnection(user.id, toolId);

  return NextResponse.json({
    connected: connection?.connected ?? false,
    account: connection?.accountName ?? null,
    connectedAt: connection?.connectedAt ?? null,
    lastSync: connection?.lastSyncAt ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolId } = await params;
  const body = await req.json().catch(() => ({}));
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Used by OAuth callbacks to save connection data
  if (body.action === 'saveConnection') {
    const updated = await storage.upsertToolConnection(user.id, toolId, {
      connected: body.connected ?? true,
      connectedAt: body.connectedAt ? new Date(body.connectedAt).toISOString() : new Date().toISOString(),
      lastSyncAt: body.lastSyncAt ? new Date(body.lastSyncAt).toISOString() : new Date().toISOString(),
      accountName: body.accountName,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      accountId: body.accountId,
    });
    return NextResponse.json({ connection: updated });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolId } = await params;
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await storage.deleteToolConnection(user.id, toolId);
  return NextResponse.json({ success: true });
}
