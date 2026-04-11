import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const rules = await prisma.rule.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rule = await prisma.rule.create({ data: body });
  return NextResponse.json(rule, { status: 201 });
}
