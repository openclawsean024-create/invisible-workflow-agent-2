import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Client } from '@temporalio/client';

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

  // Create new execution for retry
  const newExecution = await prisma.execution.create({
    data: {
      ruleId: execution.ruleId,
      userId: execution.userId,
      status: 'running',
    },
  });

  // Try to signal Temporal workflow if available
  const temporalHost = process.env.TEMPORAL_HOST;
  if (temporalHost) {
    try {
      const temporal = new Client({ host: temporalHost });
      await temporal.workflow.signalWithStart('automationWorkflow', {
        args: [execution.ruleId, newExecution.id],
        taskQueue: 'invisible-workflow',
        workflowId: `retry-${newExecution.id}`,
        signal: 'retry',
        signalArgs: [execution.ruleId, newExecution.id],
      });
    } catch (err) {
      console.error('Temporal retry error:', err);
      // Continue anyway - we'll handle it without Temporal
    }
  }

  // Update execution status based on Temporal result
  // For now, mark as running (would be updated by workflow completion)
  return NextResponse.json({
    execution: newExecution,
    message: 'Retry initiated',
  });
}
