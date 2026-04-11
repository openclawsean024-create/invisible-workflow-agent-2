import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/rules/[ruleId]/toggle - Toggle rule enabled/disabled
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ruleId } = await params;
  const rule = await prisma.rule.findUnique({ where: { id: ruleId } });

  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  const updated = await prisma.rule.update({
    where: { id: ruleId },
    data: { enabled: !rule.enabled },
  });

  return NextResponse.json({ rule: updated });
}
