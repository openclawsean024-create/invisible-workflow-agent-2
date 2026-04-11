'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/app/page';
import { SAMPLE_LOGS, TOOLS } from '@/lib/types';

interface DashboardStats {
  activeRules: number;
  connectedTools: number;
  totalTools: number;
  successRate: number;
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  weeklyStats: Array<{ date: string; success: number; failed: number }>;
  estimatedMinutesSaved: number;
}

export default function Dashboard() {
  const { lang } = useApp();
  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d))
      .catch(() => {})
  }, []);

  useEffect(() => {
    fetch('/api/executions?limit=6')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.executions) setLogs(d.executions.map((e: { id: string; rule: { name: string }; status: string; startedAt: string; details?: string }) => ({ id: e.id, ruleId: e.rule?.name ?? 'Rule', ruleName: e.rule?.name ?? 'Rule', action: e.details ?? '', status: e.status as 'success' | 'failed' | 'running', timestamp: e.startedAt, details: e.details ?? '', tool: 'System' }))) })
      .catch(() => {})
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: `log-${Date.now()}`,
        ruleId: '1',
        ruleName: lang === 'zh' ? '系統監控中' : 'System Monitoring',
        action: lang === 'zh' ? 'Agent 正在監控工作流程...' : 'Agent monitoring workflow...',
        status: 'running' as const,
        timestamp: new Date().toISOString(),
        details: lang === 'zh' ? '等待觸發事件...' : 'Waiting for trigger events...',
        tool: 'System',
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 8000);
    return () => clearInterval(interval);
  }, [lang]);

  const activeRules = stats?.activeRules ?? 2;
  const connectedTools = stats?.connectedTools ?? 0;
  const successRate = stats?.successRate ?? 95;
  const savedMinutes = stats?.estimatedMinutesSaved ?? 180;

  const formatSaved = (mins: number) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {lang === 'zh' ? '儀表板' : 'Dashboard'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {lang === 'zh' ? '掌握所有工作流程的狀態' : 'Monitor all your workflow statuses'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: lang === 'zh' ? '活躍規則' : 'Active Rules', value: activeRules, icon: '⚙️', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
          { label: lang === 'zh' ? '已串接工具' : 'Connected Tools', value: `${connectedTools}/6`, icon: '🔗', color: 'text-green-400', bg: 'bg-green-900/30' },
          { label: lang === 'zh' ? '執行成功率' : 'Success Rate', value: `${successRate}%`, icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
          { label: lang === 'zh' ? '節省時間/週' : 'Saved/Week', value: formatSaved(savedMinutes), icon: '⏱️', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} border border-gray-800 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${card.color} mb-1`}>{card.value}</div>
            <div className="text-xs text-gray-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">
              {lang === 'zh' ? '即時日誌' : 'Live Log Feed'}
            </h3>
          </div>
          <span className="text-xs text-gray-500">{lang === 'zh' ? '自動更新中' : 'Auto-refreshing'}</span>
        </div>
        <div className="divide-y divide-gray-800 max-h-72 overflow-y-auto">
          {logs.slice(0, 6).map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors">
              <span className={`mt-0.5 text-sm ${
                log.status === 'success' ? 'text-green-400' :
                log.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {log.status === 'success' ? '✓' : log.status === 'failed' ? '✗' : '⟳'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{log.ruleName}</div>
                <div className="text-xs text-gray-400 truncate">{log.details}</div>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString(lang === 'zh' ? 'zh-TW' : 'en-US')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {lang === 'zh' ? '規則概覽' : 'Rules Overview'}
          </h3>
          <div className="space-y-3">
            {TOOLS.slice(0, 3).map((tool) => (
              <div key={tool.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stats ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-sm text-gray-300 truncate">
                    {stats ? `${activeRules} ${lang === 'zh' ? '條活躍規則' : 'active rules'}` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {lang === 'zh' ? '工具串接' : 'Tool Integrations'}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {TOOLS.slice(0, 6).map((tool) => (
              <div key={tool.id} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-800/50">
                <span className="text-xl">{tool.icon}</span>
                <span className="text-xs text-gray-400 truncate w-full text-center">
                  {lang === 'zh' ? tool.nameZh : tool.name}
                </span>
                <span className={`text-xs ${stats && tool.id === 'gmail' && stats.connectedTools > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                  {tool.id === 'gmail' && connectedTools > 0 ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
