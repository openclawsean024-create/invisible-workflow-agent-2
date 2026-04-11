import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

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
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const execution = await storage.getExecution(executionId);
  if (!execution || execution.userId !== user.id) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  if (execution.status !== 'failed') {
    return NextResponse.json({ error: 'Only failed executions can be retried' }, { status: 400 });
  }

  const newExecution = await storage.createExecution({
    ruleId: execution.ruleId,
    userId: execution.userId,
    status: 'running',
    startedAt: new Date().toISOString(),
  });

  // In a real implementation, this would trigger the workflow executor
  // For now, mark as success after a short delay simulation
  setTimeout(async () => {
    await storage.updateExecution(newExecution.id, {
      status: 'success',
      completedAt: new Date().toISOString(),
      details: 'Retry completed successfully',
    });
  }, 1000);

  return NextResponse.json({
    execution: newExecution,
    message: 'Retry initiated',
  });
}
