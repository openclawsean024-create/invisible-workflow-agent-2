/**
 * Demo data for MVP - used when no session is available.
 * This allows the app to work without OAuth login.
 */

export const DEMO_USER_ID = 'demo-user-001';

export const DEMO_RULES = [
  {
    id: 'demo-rule-001',
    userId: DEMO_USER_ID,
    name: '每日早晨摘要',
    trigger: 'scheduled',
    condition: JSON.stringify({ text: '每天早上 9:00 執行' }),
    action: JSON.stringify({ text: '發送天氣摘要到 Slack' }),
    schedule: '0 9 * * *',
    enabled: true,
    lastRunAt: new Date(Date.now() - 86400000).toISOString(),
    runCount: 12,
    successCount: 11,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-rule-002',
    userId: DEMO_USER_ID,
    name: '會議結束通知',
    trigger: 'meeting_ended',
    condition: JSON.stringify({ text: '每當會議結束時' }),
    action: JSON.stringify({ text: '寄送會議摘要到 Email' }),
    schedule: undefined,
    enabled: true,
    lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    runCount: 28,
    successCount: 27,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'demo-rule-003',
    userId: DEMO_USER_ID,
    name: 'Gmail 重要郵件標記',
    trigger: 'email_received',
    condition: JSON.stringify({ text: '收到重要郵件時' }),
    action: JSON.stringify({ text: '自動標記並轉發' }),
    schedule: undefined,
    enabled: false,
    lastRunAt: null,
    runCount: 5,
    successCount: 5,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const DEMO_EXECUTIONS = [
  { id: 'exec-001', ruleId: 'demo-rule-001', userId: DEMO_USER_ID, status: 'success', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86390000).toISOString() },
  { id: 'exec-002', ruleId: 'demo-rule-002', userId: DEMO_USER_ID, status: 'success', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3590000).toISOString() },
  { id: 'exec-003', ruleId: 'demo-rule-001', userId: DEMO_USER_ID, status: 'failed', startedAt: new Date(Date.now() - 2 * 86400000).toISOString(), completedAt: new Date(Date.now() - 2 * 86400000 + 60000).toISOString() },
  { id: 'exec-004', ruleId: 'demo-rule-002', userId: DEMO_USER_ID, status: 'success', startedAt: new Date(Date.now() - 86400000 - 3600000).toISOString(), completedAt: new Date(Date.now() - 86400000 - 3500000).toISOString() },
  { id: 'exec-005', ruleId: 'demo-rule-001', userId: DEMO_USER_ID, status: 'success', startedAt: new Date(Date.now() - 3 * 86400000).toISOString(), completedAt: new Date(Date.now() - 3 * 86400000 + 45000).toISOString() },
  { id: 'exec-006', ruleId: 'demo-rule-002', userId: DEMO_USER_ID, status: 'success', startedAt: new Date(Date.now() - 4 * 86400000).toISOString(), completedAt: new Date(Date.now() - 4 * 86400000 + 30000).toISOString() },
  { id: 'exec-007', ruleId: 'demo-rule-001', userId: DEMO_USER_ID, status: 'success', startedAt: new Date(Date.now() - 5 * 86400000).toISOString(), completedAt: new Date(Date.now() - 5 * 86400000 + 52000).toISOString() },
];

export const DEMO_TOOL_CONNECTIONS = [
  { id: 'tc-001', userId: DEMO_USER_ID, toolId: 'gmail', connected: true, connectedAt: new Date(Date.now() - 30 * 86400000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tc-002', userId: DEMO_USER_ID, toolId: 'slack', connected: true, connectedAt: new Date(Date.now() - 14 * 86400000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'tc-003', userId: DEMO_USER_ID, toolId: 'notion', connected: false, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
];

export function getDemoSession() {
  return {
    user: { id: DEMO_USER_ID, email: 'demo@invisible.tech', name: 'Sophia Demo' }
  };
}
