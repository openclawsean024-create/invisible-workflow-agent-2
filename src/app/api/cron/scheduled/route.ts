import { NextResponse } from 'next/server';
import { executeScheduledRules } from '@/lib/workflow-executor';

// GET /api/cron/scheduled - Cron endpoint for scheduled rule execution
// This endpoint should be called by Vercel Cron (or external cron service)
// Vercel cron: configure in vercel.json with route "/api/cron/scheduled"
export async function GET() {
  try {
    const result = await executeScheduledRules();
    return NextResponse.json({
      success: true,
      executed: result.executed,
      results: result.results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
