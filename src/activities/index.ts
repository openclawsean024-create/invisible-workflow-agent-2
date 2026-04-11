// Temporal Activities — tool-specific action executors

import { prisma } from '@/lib/prisma';

export interface RecordExecutionInput {
  executionId: string;
  status: 'success' | 'failed' | 'running';
  details?: string;
  completedAt?: Date;
}

/** Record execution result to database */
export async function recordExecution(input: RecordExecutionInput): Promise<void> {
  const { executionId, status, details, completedAt } = input;
  await prisma.execution.update({
    where: { id: executionId },
    data: {
      status,
      details: details ?? null,
      completedAt: completedAt ?? new Date(),
    },
  });

  // Update rule stats
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    select: { ruleId: true, status: true },
  });

  if (execution) {
    const updates: Record<string, unknown> = { lastRunAt: new Date() };
    if (execution.status === 'success') {
      updates.successCount = { increment: 1 };
    }
    updates.runCount = { increment: 1 };
    await prisma.rule.update({
      where: { id: execution.ruleId },
      data: updates,
    });
  }
}

/** Find all rules due for scheduled execution */
export async function findDueRules(): Promise<Array<{ id: string; name: string; trigger: string }>> {
  // In production, this would use a cron schedule query
  // For now, return scheduled rules that are enabled
  const rules = await prisma.rule.findMany({
    where: {
      enabled: true,
      trigger: 'scheduled',
      OR: [
        { lastRunAt: null },
        { lastRunAt: { lt: new Date(Date.now() - 60000) } }, // Due if not run in last minute
      ],
    },
    select: { id: true, name: true, trigger: true },
    take: 10,
  });
  return rules;
}

export interface ExecuteGmailInput {
  userId: string;
  action: 'send_email' | 'search_emails';
  params: Record<string, string>;
}

export async function executeGmailAction(input: ExecuteGmailInput): Promise<Record<string, unknown>> {
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: input.userId, toolId: 'gmail' } },
  });

  if (!connection?.connected || !connection.accessToken) {
    throw new Error('Gmail not connected');
  }

  if (input.action === 'send_email') {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: Buffer.from(
          `To: ${input.params.to}\r\nSubject: ${input.params.subject}\r\n\r\n${input.params.body}`
        ).toString('base64url'),
      }),
    });
    return { success: true, messageId: (await res.json()).id };
  }

  return { success: false, message: 'Unknown Gmail action' };
}

export interface ExecuteSlackInput {
  userId: string;
  action: 'send_message' | 'create_channel';
  params: Record<string, string>;
}

export async function executeSlackAction(input: ExecuteSlackInput): Promise<Record<string, unknown>> {
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: input.userId, toolId: 'slack' } },
  });

  if (!connection?.connected || !connection.accessToken) {
    throw new Error('Slack not connected');
  }

  if (input.action === 'send_message') {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: input.params.channel,
        text: input.params.text,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return { success: true, ts: data.ts };
  }

  return { success: false, message: 'Unknown Slack action' };
}

export interface ExecuteNotionInput {
  userId: string;
  action: 'create_page' | 'update_page' | 'query_database';
  params: Record<string, string>;
}

export async function executeNotionAction(input: ExecuteNotionInput): Promise<Record<string, unknown>> {
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: input.userId, toolId: 'notion' } },
  });

  if (!connection?.connected || !connection.accessToken) {
    throw new Error('Notion not connected');
  }

  if (input.action === 'create_page') {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { page_id: input.params.parent_page_id },
        properties: {
          title: { title: [{ text: { content: input.params.title } }] },
        },
        children: input.params.children ? JSON.parse(input.params.children) : [],
      }),
    });
    const data = await res.json();
    if (data.object === 'error') throw new Error(data.message);
    return { success: true, pageId: data.id };
  }

  return { success: false, message: 'Unknown Notion action' };
}

export interface ExecuteTrelloInput {
  userId: string;
  action: 'create_card' | 'move_card' | 'add_comment';
  params: Record<string, string>;
}

export async function executeTrelloAction(input: ExecuteTrelloInput): Promise<Record<string, unknown>> {
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: input.userId, toolId: 'trello' } },
  });

  if (!connection?.connected || !connection.accessToken) {
    throw new Error('Trello not connected');
  }

  const apiKey = process.env.TRELLO_API_KEY ?? '';
  const token = connection.accessToken;

  if (input.action === 'create_card') {
    const res = await fetch(
      `https://api.trello.com/1/cards?key=${apiKey}&token=${token}&idList=${input.params.list_id}&name=${encodeURIComponent(input.params.name)}&desc=${encodeURIComponent(input.params.desc ?? '')}`,
      { method: 'POST' }
    );
    const data = await res.json();
    if (data.id) return { success: true, cardId: data.id, url: data.shortUrl };
    throw new Error('Failed to create Trello card');
  }

  if (input.action === 'move_card') {
    const res = await fetch(
      `https://api.trello.com/1/cards/${input.params.card_id}?key=${apiKey}&token=${token}&idList=${input.params.list_id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
    );
    const data = await res.json();
    return { success: true, cardId: data.id };
  }

  return { success: false, message: 'Unknown Trello action' };
}

export interface ExecuteGitHubInput {
  userId: string;
  action: 'create_issue' | 'create_pr' | 'add_comment';
  params: Record<string, string>;
}

export async function executeGitHubAction(input: ExecuteGitHubInput): Promise<Record<string, unknown>> {
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: input.userId, toolId: 'github' } },
  });

  if (!connection?.connected || !connection.accessToken) {
    throw new Error('GitHub not connected');
  }

  if (input.action === 'create_issue') {
    const res = await fetch(`https://api.github.com/repos/${input.params.repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: input.params.title,
        body: input.params.body ?? '',
        labels: input.params.labels ? input.params.labels.split(',') : [],
      }),
    });
    const data = await res.json();
    if (data.id) return { success: true, issueNumber: data.number, url: data.html_url };
    throw new Error(data.message ?? 'Failed to create issue');
  }

  return { success: false, message: 'Unknown GitHub action' };
}

export interface ExecuteCalendarInput {
  userId: string;
  action: 'create_event' | 'get_events';
  params: Record<string, string>;
}

export async function executeCalendarAction(input: ExecuteCalendarInput): Promise<Record<string, unknown>> {
  const connection = await prisma.toolConnection.findUnique({
    where: { userId_toolId: { userId: input.userId, toolId: 'google-calendar' } },
  });

  if (!connection?.connected || !connection.accessToken) {
    throw new Error('Google Calendar not connected');
  }

  if (input.action === 'create_event') {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: input.params.summary,
        description: input.params.description ?? '',
        start: { dateTime: input.params.start_time, timeZone: 'Asia/Taipei' },
        end: { dateTime: input.params.end_time, timeZone: 'Asia/Taipei' },
        attendees: input.params.attendees
          ? input.params.attendees.split(',').map((e) => ({ email: e.trim() }))
          : [],
      }),
    });
    const data = await res.json();
    if (data.id) return { success: true, eventId: data.id, htmlLink: data.htmlLink };
    throw new Error(data.error?.message ?? 'Failed to create calendar event');
  }

  return { success: false, message: 'Unknown Calendar action' };
}
