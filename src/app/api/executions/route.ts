import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/executions - Get execution logs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const status = searchParams.get('status');
  const ruleId = searchParams.get('ruleId');

  const executions = await prisma.execution.findMany({
    where: {
      userId: user.id,
      ...(status && { status }),
      ...(ruleId && { ruleId }),
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      rule: { select: { id: true, name: true, trigger: true } },
    },
  });

  return NextResponse.json({ executions });
}
