import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { DEMO_RULES, getDemoSession } from '@/lib/demo-data';

export async function GET() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // NEXTAUTH_SECRET not set - use demo mode
    session = getDemoSession();
  }

  // Demo mode: return demo data without storage
  if (!session?.user?.email) {
    return NextResponse.json({ rules: DEMO_RULES, demo: true });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    // Demo user not in storage - return demo data
    if (session.user.email === 'demo@invisible.tech') {
      return NextResponse.json({ rules: DEMO_RULES, demo: true });
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const rules = await storage.listRules(user.id);
  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = getDemoSession();
  }

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    if (session.user.email === 'demo@invisible.tech') {
      return NextResponse.json({ error: 'Demo mode: rule creation not persisted' }, { status: 403 });
    }
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
