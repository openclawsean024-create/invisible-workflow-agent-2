import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { DEMO_RULES, DEMO_EXECUTIONS, DEMO_TOOL_CONNECTIONS, getDemoSession } from '@/lib/demo-data';

function calcStats(rules: any[], executions: any[], toolConnections: any[]) {
  const activeRules = rules.filter(r => r.enabled).length;
  const connectedTools = toolConnections.filter(t => t.connected).length;
  const totalExecutions = executions.length;
  const successCount = executions.filter(e => e.status === 'success').length;
  const failedCount = executions.filter(e => e.status === 'failed').length;
  const successRate = totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 100;

  const recent = [...executions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 7);
  const weeklyStats = recent.map(e => ({
    date: e.startedAt.split('T')[0],
    success: e.status === 'success' ? 1 : 0,
    failed: e.status === 'failed' ? 1 : 0,
  })).reverse();

  const estimatedMinutesSaved = successCount * 5;

  return {
    activeRules,
    connectedTools,
    totalTools: 6,
    successRate,
    totalExecutions: totalExecutions,
    successCount,
    failedCount,
    weeklyStats,
    estimatedMinutesSaved,
  };
}

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = getDemoSession();
  }

  // Demo mode
  if (!session?.user?.email) {
    return NextResponse.json({ ...calcStats(DEMO_RULES, DEMO_EXECUTIONS, DEMO_TOOL_CONNECTIONS), demo: true });
  }

  // Demo user
  if (session.user.email === 'demo@invisible.tech') {
    return NextResponse.json({ ...calcStats(DEMO_RULES, DEMO_EXECUTIONS, DEMO_TOOL_CONNECTIONS), demo: true });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const rules = await storage.listRules(user.id);
  const toolConnections = await storage.getToolConnectionsByUserId(user.id);
  const recentExecutions = await storage.listExecutions(user.id, { limit: 7 });
  const allExecutions = await storage.listExecutions(user.id);

  return NextResponse.json(calcStats(rules, allExecutions, toolConnections));
}
