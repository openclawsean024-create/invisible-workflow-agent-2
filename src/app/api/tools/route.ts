import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/tools - List all tools with connection status
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const connections = await prisma.toolConnection.findMany({
    where: { user: { email: userEmail } },
  });

  const tools = [
    { id: 'gmail', name: 'Gmail', nameZh: 'Gmail', icon: '📧', description: 'Email client for sending and receiving emails', descriptionZh: '電子郵件客戶端，用於發送和接收郵件' },
    { id: 'google-calendar', name: 'Google Calendar', nameZh: 'Google 日曆', icon: '📅', description: 'Calendar and scheduling tool', descriptionZh: '日曆和日程安排工具' },
    { id: 'slack', name: 'Slack', nameZh: 'Slack', icon: '💬', description: 'Team communication and messaging platform', descriptionZh: '團隊溝通和訊息平台' },
    { id: 'notion', name: 'Notion', nameZh: 'Notion', icon: '📝', description: 'All-in-one workspace for notes and docs', descriptionZh: '一站式工作區，用於筆記和文檔' },
    { id: 'trello', name: 'Trello', nameZh: 'Trello', icon: '📋', description: 'Kanban-style project management', descriptionZh: '看板式專案管理工具' },
    { id: 'github', name: 'GitHub', nameZh: 'GitHub', icon: '🐙', description: 'Code hosting and version control', descriptionZh: '程式碼托管和版本控制' },
  ];

  const result = tools.map((tool) => {
    const conn = connections.find((c) => c.toolId === tool.id);
    return {
      ...tool,
      connected: conn?.connected ?? false,
      account: conn?.accountName ?? null,
      connectedAt: conn?.connectedAt?.toISOString() ?? null,
      lastSync: conn?.lastSyncAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ tools: result });
}
