import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/rules - Get all rules for current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const rules = await prisma.rule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { executions: true } } },
  });

  return NextResponse.json({ rules });
}

// POST /api/rules - Create a new rule
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
  const { name, trigger, condition, action, schedule } = body;

  if (!name || !trigger || !condition || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rule = await prisma.rule.create({
    data: {
      userId: user.id,
      name,
      trigger,
      condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
      action: typeof action === 'string' ? action : JSON.stringify(action),
      schedule: schedule ?? null,
      enabled: true,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
