import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// GET /api/executions - Get execution logs
// POST /api/executions - Create a new execution (trigger a rule manually)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const status = searchParams.get('status') ?? undefined;
  const ruleId = searchParams.get('ruleId') ?? undefined;

  const executions = await storage.listExecutions(user.id, { status, ruleId, limit });

  // Enrich with rule names
  const rules = await storage.listRules(user.id);
  const ruleMap = new Map(rules.map(r => [r.id, r]));

  const enriched = executions.map(e => ({
    ...e,
    rule: ruleMap.get(e.ruleId) ? { id: ruleMap.get(e.ruleId)!.id, name: ruleMap.get(e.ruleId)!.name, trigger: ruleMap.get(e.ruleId)!.trigger } : null,
  }));

  return NextResponse.json({ executions: enriched });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { ruleId } = body;

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

  return NextResponse.json({ execution }, { status: 201 });
}
