import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { executeRule } from '@/lib/workflow-executor';

// POST /api/executions/[executionId]/retry - Retry a failed execution
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { executionId } = await params;
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: { rule: true },
  });

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  if (execution.status !== 'failed') {
    return NextResponse.json({ error: 'Only failed executions can be retried' }, { status: 400 });
  }

  const newExecution = await prisma.execution.create({
    data: {
      ruleId: execution.ruleId,
      userId: execution.userId,
      status: 'running',
    },
  });

  const result = await executeRule(execution.ruleId, newExecution.id);

  return NextResponse.json({
    execution: newExecution,
    result,
    message: 'Retry completed',
  });
}
