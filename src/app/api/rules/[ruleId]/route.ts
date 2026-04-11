import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/rules/[ruleId] - Get a single rule
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
  const rule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { executions: { orderBy: { startedAt: 'desc' }, take: 10 } },
  });

  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  return NextResponse.json({ rule });
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
  const body = await req.json();
  const { name, trigger, condition, action, schedule, enabled } = body;

  const rule = await prisma.rule.update({
    where: { id: ruleId },
    data: {
      ...(name !== undefined && { name }),
      ...(trigger !== undefined && { trigger }),
      ...(condition !== undefined && { condition: typeof condition === 'string' ? condition : JSON.stringify(condition) }),
      ...(action !== undefined && { action: typeof action === 'string' ? action : JSON.stringify(action) }),
      ...(schedule !== undefined && { schedule }),
      ...(enabled !== undefined && { enabled }),
    },
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
  await prisma.rule.delete({ where: { id: ruleId } });
  return NextResponse.json({ success: true });
}
