import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Rule, ToolConnection, Execution } from '@prisma/client';

// GET /api/dashboard/stats - Dashboard statistics
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [rules, toolConnections, recentExecutions, totalExecutions] = await Promise.all([
    prisma.rule.findMany({ where: { userId: user.id } }),
    prisma.toolConnection.findMany({ where: { userId: user.id } }),
    prisma.execution.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: 7,
    }),
    prisma.execution.findMany({
      where: { userId: user.id },
    }),
  ]);

  const activeRules = rules.filter((r: Rule) => r.enabled).length;
  const connectedTools = toolConnections.filter((t: ToolConnection) => t.connected).length;

  const successCount = totalExecutions.filter((e: Execution) => e.status === 'success').length;
  const failedCount = totalExecutions.filter((e: Execution) => e.status === 'failed').length;
  const totalCount = totalExecutions.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  // Weekly executions for chart
  const weeklyStats = recentExecutions.reverse().map((e: Execution) => ({
    date: e.startedAt.toISOString().split('T')[0],
    success: e.status === 'success' ? 1 : 0,
    failed: e.status === 'failed' ? 1 : 0,
  }));

  // Estimated time saved (rough estimate: 5 min per execution)
  const estimatedMinutesSaved = totalExecutions.filter((e: Execution) => e.status === 'success').length * 5;

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
