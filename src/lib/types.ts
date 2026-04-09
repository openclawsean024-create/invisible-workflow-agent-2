export type Language = 'zh' | 'en';

export interface Tool {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  connected: boolean;
  description: string;
  descriptionZh: string;
}

export interface Rule {
  id: string;
  name: string;
  nameZh: string;
  trigger: string; // e.g. "meeting_ended", "email_received"
  triggerZh: string;
  condition: string; // natural language condition
  conditionZh: string;
  action: string; // natural language action
  actionZh: string;
  enabled: boolean;
  schedule?: string; // cron expression
  scheduleZh?: string;
  lastRun?: string;
  runCount: number;
  successCount: number;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  action: string;
  status: 'success' | 'failed' | 'running';
  timestamp: string;
  details: string;
  tool: string;
}

export interface ToolConnection {
  toolId: string;
  connected: boolean;
  account?: string;
  connectedAt?: string;
  lastSync?: string;
}

export const TOOLS: Tool[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    nameZh: 'Gmail',
    icon: '📧',
    connected: false,
    description: 'Email client for sending and receiving emails',
    descriptionZh: '電子郵件客戶端，用於發送和接收郵件',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    nameZh: 'Google 日曆',
    icon: '📅',
    connected: false,
    description: 'Calendar and scheduling tool',
    descriptionZh: '日曆和日程安排工具',
  },
  {
    id: 'slack',
    name: 'Slack',
    nameZh: 'Slack',
    icon: '💬',
    connected: false,
    description: 'Team communication and messaging platform',
    descriptionZh: '團隊溝通和訊息平台',
  },
  {
    id: 'notion',
    name: 'Notion',
    nameZh: 'Notion',
    icon: '📝',
    connected: false,
    description: 'All-in-one workspace for notes and docs',
    descriptionZh: '一站式工作區，用於筆記和文檔',
  },
  {
    id: 'trello',
    name: 'Trello',
    nameZh: 'Trello',
    icon: '📋',
    connected: false,
    description: 'Kanban-style project management',
    descriptionZh: '看板式專案管理工具',
  },
  {
    id: 'github',
    name: 'GitHub',
    nameZh: 'GitHub',
    icon: '🐙',
    connected: false,
    description: 'Code hosting and version control',
    descriptionZh: '程式碼托管和版本控制',
  },
];

export const TRIGGERS = [
  { id: 'meeting_ended', name: 'Meeting ended', nameZh: '會議結束', icon: '🏁' },
  { id: 'email_received', name: 'Email received', nameZh: '收到郵件', icon: '📩' },
  { id: 'scheduled', name: 'Scheduled (Cron)', nameZh: '排程執行', icon: '⏰' },
  { id: 'github_pr', name: 'GitHub PR created', nameZh: 'GitHub PR 建立', icon: '🔀' },
  { id: 'notion_updated', name: 'Notion page updated', nameZh: 'Notion 頁面更新', icon: '📄' },
  { id: 'trello_card_moved', name: 'Trello card moved', nameZh: 'Trello 卡片移動', icon: '📌' },
];

export const SAMPLE_RULES: Rule[] = [
  {
    id: '1',
    name: 'Meeting Summary to Slack',
    nameZh: '會議摘要發送到 Slack',
    trigger: 'meeting_ended',
    triggerZh: '會議結束',
    condition: 'When a meeting ends',
    conditionZh: '每當會議結束',
    action: 'Send meeting summary to #general channel',
    actionZh: '傳送會議摘要到 #general 頻道',
    enabled: true,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    runCount: 12,
    successCount: 11,
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Daily Report Email',
    nameZh: '每日報告郵件',
    trigger: 'scheduled',
    triggerZh: '排程執行',
    condition: 'Every day at 9:00 AM',
    conditionZh: '每天上午 9:00',
    action: 'Send daily report to team email',
    actionZh: '傳送每日報告到團隊郵箱',
    enabled: true,
    schedule: '0 9 * * *',
    scheduleZh: '每天上午 9:00',
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    runCount: 7,
    successCount: 7,
    createdAt: '2026-04-02T10:00:00Z',
  },
];

export const SAMPLE_LOGS: LogEntry[] = [
  {
    id: 'log1',
    ruleId: '1',
    ruleName: 'Meeting Summary to Slack',
    action: 'Send meeting summary to #general channel',
    status: 'success',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: 'Successfully sent summary to Slack channel. 3 participants notified.',
    tool: 'Slack',
  },
  {
    id: 'log2',
    ruleId: '2',
    ruleName: 'Daily Report Email',
    action: 'Send daily report to team email',
    status: 'success',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'Email sent to 5 team members. Open rate: 80%.',
    tool: 'Gmail',
  },
  {
    id: 'log3',
    ruleId: '1',
    ruleName: 'Meeting Summary to Slack',
    action: 'Send meeting summary to #general channel',
    status: 'failed',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    details: 'Slack API rate limit exceeded. Retry scheduled in 5 minutes.',
    tool: 'Slack',
  },
];
