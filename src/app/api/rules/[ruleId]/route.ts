import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// GET /api/rules/[ruleId] - Get a single rule with recent executions
// PUT /api/rules/[ruleId] - Update a rule
// DELETE /api/rules/[ruleId] - Delete a rule
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ruleId } = await params;
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const rule = await storage.getRule(ruleId);
  if (!rule || rule.userId !== user.id) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  const executions = await storage.listExecutions(user.id, { ruleId, limit: 10 });

  return NextResponse.json({ rule, executions });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ruleId } = await params;
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await storage.getRule(ruleId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, trigger, condition, action, schedule, enabled } = body;

  const rule = await storage.updateRule(ruleId, {
    ...(name !== undefined && { name }),
    ...(trigger !== undefined && { trigger }),
    ...(condition !== undefined && { condition: typeof condition === 'string' ? condition : JSON.stringify(condition) }),
    ...(action !== undefined && { action: typeof action === 'string' ? action : JSON.stringify(action) }),
    ...(schedule !== undefined && { schedule }),
    ...(enabled !== undefined && { enabled }),
  });

  return NextResponse.json({ rule });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ruleId } = await params;
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await storage.getRule(ruleId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  await storage.deleteRule(ruleId);
  return NextResponse.json({ success: true });
}
