// Workflow Executor — direct execution backend for Vercel
// Temporal workflow definitions remain in src/workflows/, but runtime execution
// uses direct API calls so the backend works in serverless deployment.

import { prisma } from './prisma';
import {
  recordExecution,
  findDueRules,
  executeGmailAction,
  executeSlackAction,
  executeNotionAction,
  executeTrelloAction,
  executeGitHubAction,
  executeCalendarAction,
} from '@/activities';

export interface ActionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface AutomationInput {
  ruleId: string;
  executionId: string;
  triggerEvent?: Record<string, unknown>;
}

export async function executeRule(
  ruleId: string,
  executionId: string,
  triggerEvent?: Record<string, unknown>
): Promise<ActionResult> {
  await prisma.execution.update({
    where: { id: executionId },
    data: { status: 'running' },
  });

  try {
    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new Error(`Rule ${ruleId} not found`);

    const condition = parseJson(rule.condition);
    const action = parseJson(rule.action);

    const conditionPassed = evaluateCondition(condition, triggerEvent);
    if (!conditionPassed.passed) {
      await recordExecution({
        executionId,
        status: 'success',
        details: `Condition not met: ${conditionPassed.reason}`,
        completedAt: new Date(),
      });
      return { success: true, message: `Condition not met: ${conditionPassed.reason}` };
    }

    const actionResult = await executeAction(rule.userId, action, triggerEvent);

    await recordExecution({
      executionId,
      status: actionResult.success ? 'success' : 'failed',
      details: actionResult.message,
      completedAt: new Date(),
    });

    await prisma.rule.update({
      where: { id: ruleId },
      data: {
        lastRunAt: new Date(),
        runCount: { increment: 1 },
        ...(actionResult.success && { successCount: { increment: 1 } }),
      },
    });

    return actionResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await recordExecution({
      executionId,
      status: 'failed',
      details: message,
      completedAt: new Date(),
    });
    return { success: false, message };
  }
}

function parseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

function evaluateCondition(
  condition: Record<string, unknown>,
  triggerEvent?: Record<string, unknown>
): { passed: boolean; reason?: string } {
  if (condition.type === 'scheduled' || condition.trigger === 'scheduled') return { passed: true };
  if (triggerEvent && condition.field && condition.operator) {
    const value = triggerEvent[String(condition.field)];
    const expected = condition.value;
    if (condition.operator === 'equals') {
      return value === expected ? { passed: true } : { passed: false, reason: `${condition.field} != ${expected}` };
    }
    if (condition.operator === 'contains') {
      return String(value).includes(String(expected))
        ? { passed: true }
        : { passed: false, reason: `${condition.field} does not contain ${expected}` };
    }
  }
  return { passed: true };
}

async function executeAction(
  userId: string,
  action: Record<string, unknown>,
  triggerEvent?: Record<string, unknown>
): Promise<ActionResult> {
  const actionType = String(action.type ?? '');
  const tool = String(action.tool ?? '');
  const params = (action.params ?? triggerEvent ?? {}) as Record<string, string>;

  switch (tool) {
    case 'gmail':
    case 'email':
      return wrap(await executeGmailAction({ userId, action: (actionType || 'send_email') as 'send_email' | 'search_emails', params }));
    case 'slack':
      return wrap(await executeSlackAction({ userId, action: (actionType || 'send_message') as 'send_message' | 'create_channel', params }));
    case 'notion':
      return wrap(await executeNotionAction({ userId, action: (actionType || 'create_page') as 'create_page' | 'update_page' | 'query_database', params }));
    case 'trello':
      return wrap(await executeTrelloAction({ userId, action: (actionType || 'create_card') as 'create_card' | 'move_card' | 'add_comment', params }));
    case 'github':
      return wrap(await executeGitHubAction({ userId, action: (actionType || 'create_issue') as 'create_issue' | 'create_pr' | 'add_comment', params }));
    case 'google-calendar':
    case 'calendar':
      return wrap(await executeCalendarAction({ userId, action: (actionType || 'create_event') as 'create_event' | 'get_events', params }));
    default:
      return { success: false, message: `Unknown tool: ${tool}` };
  }
}

function wrap(result: Record<string, unknown>): ActionResult {
  return { success: true, message: 'Action executed', details: result };
}

export async function executeScheduledRules(): Promise<{ executed: number; results: string[] }> {
  const rules = await findDueRules();
  const results: string[] = [];

  for (const rule of rules) {
    const fullRule = await prisma.rule.findUnique({ where: { id: rule.id }, select: { userId: true } });
    if (!fullRule) continue;

    const execution = await prisma.execution.create({
      data: { ruleId: rule.id, userId: fullRule.userId, status: 'running' },
    });
    const result = await executeRule(rule.id, execution.id);
    results.push(`[${rule.name}] ${result.message}`);
  }

  return { executed: rules.length, results };
}
