import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { executeRule } from '@/lib/workflow-executor';

// POST /api/execute - Execute a rule by ID
// Body: { ruleId: string, triggerEvent?: Record<string, unknown> }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { ruleId, triggerEvent } = body;

  if (!ruleId) {
    return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
  }

  const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }
  if (rule.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Create execution record
  const execution = await prisma.execution.create({
    data: {
      ruleId,
      userId: user.id,
      status: 'running',
    },
  });

  // Execute rule (via Temporal or direct fallback)
  try {
    const result = await executeRule(ruleId, execution.id, triggerEvent);
    return NextResponse.json({
      execution: { ...execution, status: result.success ? 'success' : 'failed' },
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed';
    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: 'failed', details: message, completedAt: new Date() },
    });
    return NextResponse.json({ execution, error: message }, { status: 500 });
  }
}
