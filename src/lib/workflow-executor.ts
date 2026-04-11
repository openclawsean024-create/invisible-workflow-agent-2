/**
 * Workflow Executor — serverless-compatible execution backend.
 * Uses JSON file storage instead of Prisma for Vercel compatibility.
 */

import { storage } from './storage';
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

export async function executeRule(
  ruleId: string,
  executionId: string,
  triggerEvent?: Record<string, unknown>
): Promise<ActionResult> {
  await storage.updateExecution(executionId, { status: 'running' });

  try {
    const rule = await storage.getRule(ruleId);
    if (!rule) throw new Error(`Rule ${ruleId} not found`);

    const condition = parseJson(rule.condition);
    const action = parseJson(rule.action);

    const conditionPassed = evaluateCondition(condition, triggerEvent);
    if (!conditionPassed.passed) {
      await recordExecution({
        executionId,
        status: 'success',
        details: `Condition not met: ${conditionPassed.reason}`,
        completedAt: new Date().toISOString(),
      });
      return { success: true, message: `Condition not met: ${conditionPassed.reason}` };
    }

    const actionResult = await executeToolAction(rule.userId, action, triggerEvent);

    await recordExecution({
      executionId,
      status: actionResult.success ? 'success' : 'failed',
      details: actionResult.message,
      completedAt: new Date().toISOString(),
    });

    return actionResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await recordExecution({
      executionId,
      status: 'failed',
      details: message,
      completedAt: new Date().toISOString(),
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

async function executeToolAction(
  userId: string,
  action: Record<string, unknown>,
  triggerEvent?: Record<string, unknown>
): Promise<ActionResult> {
  const tool = String(action.tool ?? '');
  const actionType = String(action.type ?? '');
  const params = (action.params ?? triggerEvent ?? {}) as Record<string, string>;

  try {
    let result: Record<string, unknown>;
    switch (tool) {
      case 'gmail':
      case 'email':
        result = await executeGmailAction({ userId, action: (actionType || 'send_email') as 'send_email' | 'search_emails', params });
        break;
      case 'slack':
        result = await executeSlackAction({ userId, action: (actionType || 'send_message') as 'send_message' | 'create_channel', params });
        break;
      case 'notion':
        result = await executeNotionAction({ userId, action: (actionType || 'create_page') as 'create_page' | 'update_page' | 'query_database', params });
        break;
      case 'trello':
        result = await executeTrelloAction({ userId, action: (actionType || 'create_card') as 'create_card' | 'move_card' | 'add_comment', params });
        break;
      case 'github':
        result = await executeGitHubAction({ userId, action: (actionType || 'create_issue') as 'create_issue' | 'create_pr' | 'add_comment', params });
        break;
      case 'google-calendar':
      case 'calendar':
        result = await executeCalendarAction({ userId, action: (actionType || 'create_event') as 'create_event' | 'get_events', params });
        break;
      default:
        return { success: false, message: `Unknown tool: ${tool}` };
    }
    return { success: true, message: 'Action executed', details: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message };
  }
}

export async function executeScheduledRules(): Promise<{ executed: number; results: string[] }> {
  const dueRules = await findDueRules();
  const results: string[] = [];

  for (const rule of dueRules) {
    const fullRule = await storage.getRule(rule.id);
    if (!fullRule) continue;

    const execution = await storage.createExecution({
      ruleId: rule.id,
      userId: fullRule.userId,
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    const result = await executeRule(rule.id, execution.id);
    results.push(`[${rule.name}] ${result.message}`);
  }

  return { executed: dueRules.length, results };
}
