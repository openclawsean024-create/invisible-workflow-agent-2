import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// GET /api/dashboard/stats - Dashboard statistics
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const rules = await storage.listRules(user.id);
  const toolConnections = await storage.getToolConnectionsByUserId(user.id);
  const recentExecutions = await storage.listExecutions(user.id, { limit: 7 });
  const totalExecutions = await storage.listExecutions(user.id);

  const activeRules = rules.filter(r => r.enabled).length;
  const connectedTools = toolConnections.filter(t => t.connected).length;
  const successCount = totalExecutions.filter(e => e.status === 'success').length;
  const failedCount = totalExecutions.filter(e => e.status === 'failed').length;
  const totalCount = totalExecutions.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  const weeklyStats = [...recentExecutions].reverse().map(e => ({
    date: e.startedAt.split('T')[0],
    success: e.status === 'success' ? 1 : 0,
    failed: e.status === 'failed' ? 1 : 0,
  }));

  const estimatedMinutesSaved = successCount * 5;

  return NextResponse.json({
    activeRules,
    connectedTools,
    totalTools: 6,
    successRate,
    totalExecutions: totalCount,
    successCount,
    failedCount,
    weeklyStats,
    estimatedMinutesSaved,
  });
}
