'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/app/page';
import { SAMPLE_RULES, SAMPLE_LOGS, TOOLS } from '@/lib/types';

export default function Dashboard() {
  const { lang } = useApp();
  const [logs, setLogs] = useState(SAMPLE_LOGS);

  // Simulate live log stream
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: `log-${Date.now()}`,
        ruleId: '1',
        ruleName: lang === 'zh' ? '會議摘要發送到 Slack' : 'Meeting Summary to Slack',
        action: lang === 'zh' ? '傳送會議摘要到 #general 頻道' : 'Send meeting summary to #general channel',
        status: Math.random() > 0.1 ? 'success' as const : 'running' as const,
        timestamp: new Date().toISOString(),
        details: lang === 'zh' ? 'Agent 正在監控工作流程...' : 'Agent monitoring workflow...',
        tool: 'Slack',
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 8000);
    return () => clearInterval(interval);
  }, [lang]);

  const successRate = Math.round((SAMPLE_RULES.reduce((a, r) => a + r.successCount, 0) / SAMPLE_RULES.reduce((a, r) => a + r.runCount, 0)) * 100);
  const connectedTools = TOOLS.filter((t) => t.connected).length;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          {lang === 'zh' ? '儀表板' : 'Dashboard'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {lang === 'zh' ? '掌握所有工作流程的狀態' : 'Monitor all your workflow statuses'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: lang === 'zh' ? '活躍規則' : 'Active Rules', value: SAMPLE_RULES.filter((r) => r.enabled).length, icon: '⚙️', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
          { label: lang === 'zh' ? '已串接工具' : 'Connected Tools', value: `${connectedTools}/${TOOLS.length}`, icon: '🔗', color: 'text-green-400', bg: 'bg-green-900/30' },
          { label: lang === 'zh' ? '執行成功率' : 'Success Rate', value: `${successRate}%`, icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
          { label: lang === 'zh' ? '節省時間/週' : 'Saved/Week', value: '3h', icon: '⏱️', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
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

      {/* Recent Logs Live Feed */}
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

      {/* Rules Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {lang === 'zh' ? '規則概覽' : 'Rules Overview'}
          </h3>
          <div className="space-y-3">
            {SAMPLE_RULES.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-sm text-gray-300 truncate">
                    {lang === 'zh' ? rule.nameZh : rule.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0 ml-3">
                  {rule.runCount} {lang === 'zh' ? '次執行' : 'runs'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Summary */}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
