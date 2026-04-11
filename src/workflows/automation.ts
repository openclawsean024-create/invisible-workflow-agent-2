// Temporal Workflow: automation-workflow
// Executes a single automation rule: check condition → execute action → record result

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '@/activities';

// Configure activity timeouts
const { executeGmailAction, executeSlackAction, executeNotionAction, executeTrelloAction, executeGitHubAction, executeCalendarAction, recordExecution } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 3 },
});

export interface AutomationInput {
  ruleId: string;
  executionId: string;
  triggerEvent?: Record<string, unknown>;
}

export interface ConditionResult {
  passed: boolean;
  reason?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/** Main automation workflow — runs a single rule */
export async function automationWorkflow(input: AutomationInput): Promise<ActionResult> {
  const { ruleId, executionId, triggerEvent } = input;

  try {
    // Step 1: Fetch rule details from DB via activity
    // (In production this would query the DB; here we pass data through the workflow)
    
    // Step 2: Check condition (simulate AI evaluation)
    const conditionResult = await evaluateCondition(ruleId, triggerEvent);
    if (!conditionResult.passed) {
      await recordExecution({
        executionId,
        status: 'success',
        details: `Condition not met: ${conditionResult.reason}`,
      });
      return { success: true, message: `Condition not met: ${conditionResult.reason}` };
    }

    // Step 3: Parse action and execute
    const actionResult = await executeRuleAction(ruleId, triggerEvent);

    // Step 4: Record execution result
    await recordExecution({
      executionId,
      status: actionResult.success ? 'success' : 'failed',
      details: actionResult.message,
    });

    return actionResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await recordExecution({
      executionId,
      status: 'failed',
      details: message,
    });
    return { success: false, message };
  }
}

/** Retry signal handler */
export async function automationRetryWorkflow(input: AutomationInput): Promise<ActionResult> {
  // Same as automationWorkflow but initiated via retry
  return automationWorkflow(input);
}

/** Evaluate rule condition (simulated AI evaluation) */
async function evaluateCondition(
  ruleId: string,
  triggerEvent?: Record<string, unknown>
): Promise<ConditionResult> {
  // In production, this would call an LLM to evaluate the natural language condition
  // against the trigger event. For now, we pass through.
  // The condition evaluation is done by the activity that calls the LLM API.
  try {
    const result = await evaluateConditionActivity({ ruleId, triggerEvent });
    return result;
  } catch {
    return { passed: true }; // Default to pass if evaluation fails
  }
}

async function evaluateConditionActivity(input: { ruleId: string; triggerEvent?: Record<string, unknown> }): Promise<ConditionResult> {
  // Placeholder — actual evaluation done in activity layer
  return { passed: true };
}

/** Dispatch action to the appropriate tool activity */
async function executeRuleAction(
  ruleId: string,
  triggerEvent?: Record<string, unknown>
): Promise<ActionResult> {
  // In production, rule.action would be parsed from JSON and dispatched
  // For this implementation, we use a dispatch activity
  try {
    const result = await dispatchAction({ ruleId, triggerEvent });
    return result;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Action execution failed',
    };
  }
}

async function dispatchAction(input: { ruleId: string; triggerEvent?: Record<string, unknown> }): Promise<ActionResult> {
  // This would be implemented to read the rule from DB and dispatch to correct tool
  // Stub: actual dispatch done in executeToolAction activity
  return { success: true, message: 'Action dispatched' };
}
