// Temporal Workflow: scheduled-workflow
// Cron-triggered workflow that finds and executes all due rules

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '@/activities';
import { automationWorkflow } from '@/workflows/automation';

const { findDueRules } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

/** Scheduled workflow — runs every minute via Temporal cron */
export async function scheduledWorkflow(): Promise<{ executed: number; results: string[] }> {
  // Find all rules due for execution
  const dueRules = await findDueRules();

  if (dueRules.length === 0) {
    return { executed: 0, results: [] };
  }

  // Execute each rule in parallel
  const promises = dueRules.map(async (rule: { id: string; name: string }) => {
    try {
      const result = await automationWorkflow({
        ruleId: rule.id,
        executionId: `scheduled-${rule.id}-${Date.now()}`,
      });
      return `[${rule.name}] ${result.message}`;
    } catch (err) {
      return `[${rule.name}] Failed: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
  });

  const results = await Promise.all(promises);
  return { executed: dueRules.length, results };
}
