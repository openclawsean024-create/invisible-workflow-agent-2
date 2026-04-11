// Temporal Client Configuration
// Uses Temporal Cloud when TEMPORAL_HOST_URL is configured, otherwise falls back to direct execution

import { Connection, WorkflowClient } from '@temporalio/client';
import { automationWorkflow } from '@/workflows/automation';

export interface TemporalConfig {
  enabled: boolean;
  hostUrl?: string;
  namespace?: string;
}

export function getTemporalConfig(): TemporalConfig {
  const hostUrl = process.env.TEMPORAL_HOST_URL;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  
  if (!hostUrl || !namespace) {
    return { enabled: false };
  }
  
  return { enabled: true, hostUrl, namespace };
}

let workflowClient: WorkflowClient | null = null;

async function getWorkflowClient(): Promise<WorkflowClient | null> {
  const config = getTemporalConfig();
  if (!config.enabled) return null;
  
  if (!workflowClient) {
    const connection = await Connection.connect({
      address: config.hostUrl!,
    });
    workflowClient = new WorkflowClient({
      connection,
      namespace: config.namespace!,
    });
  }
  return workflowClient;
}

export { getWorkflowClient, WorkflowClient };
