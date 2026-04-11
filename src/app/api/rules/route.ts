import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';

// GET /api/rules - List all rules for current user
// POST /api/rules - Create a new rule
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const rules = await storage.listRules(user.id);
  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, trigger, condition, action, schedule, enabled } = body;

  const rule = await storage.createRule({
    userId: user.id,
    name: name ?? 'Untitled Rule',
    trigger: trigger ?? 'scheduled',
    condition: typeof condition === 'string' ? condition : JSON.stringify(condition ?? {}),
    action: typeof action === 'string' ? action : JSON.stringify(action ?? {}),
    schedule,
    enabled: enabled ?? true,
  });

  return NextResponse.json({ rule }, { status: 201 });
}
