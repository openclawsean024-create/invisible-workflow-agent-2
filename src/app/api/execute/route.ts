import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { executeRule } from '@/lib/workflow-executor';

// POST /api/execute - Execute a rule by ID
// Body: { ruleId: string, triggerEvent?: Record<string, unknown> }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { ruleId, triggerEvent } = body;

  if (!ruleId) {
    return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
  }

  const rule = await storage.getRule(ruleId);
  if (!rule || rule.userId !== user.id) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  const execution = await storage.createExecution({
    ruleId,
    userId: user.id,
    status: 'running',
    startedAt: new Date().toISOString(),
  });

  try {
    const result = await executeRule(ruleId, execution.id, triggerEvent);
    return NextResponse.json({
      execution: { ...execution, status: result.success ? 'success' : 'failed' },
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed';
    await storage.updateExecution(execution.id, {
      status: 'failed',
      details: message,
      completedAt: new Date().toISOString(),
    });
    return NextResponse.json({ execution, error: message }, { status: 500 });
  }
}
