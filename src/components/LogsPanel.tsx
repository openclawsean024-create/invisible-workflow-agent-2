'use client';

import { useState } from 'react';
import { useApp } from '@/app/page';
import { LogEntry, SAMPLE_LOGS } from '@/lib/types';

export default function LogsPanel() {
  const { lang } = useApp();
  const [logs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const filtered = logs.filter((l) => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const statusLabel = {
    all: { zh: '全部', en: 'All' },
    success: { zh: '成功', en: 'Success' },
    failed: { zh: '失敗', en: 'Failed' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {lang === 'zh' ? '操作日誌' : 'Activity Logs'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {lang === 'zh' ? '完整的 Agent 行動日誌，可隨時審查或回溯' : 'Complete Agent action logs for review and audit'}
          </p>
        </div>
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
          {(['all', 'success', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'zh' ? statusLabel[f].zh : statusLabel[f].en}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">
                {lang === 'zh' ? '狀態' : 'Status'}
              </th>
              <th className="text-left px-5 py-3 font-medium">
                {lang === 'zh' ? '規則' : 'Rule'}
              </th>
              <th className="text-left px-5 py-3 font-medium">
                {lang === 'zh' ? '動作' : 'Action'}
              </th>
              <th className="text-left px-5 py-3 font-medium">
                {lang === 'zh' ? '工具' : 'Tool'}
              </th>
              <th className="text-left px-5 py-3 font-medium">
                {lang === 'zh' ? '詳情' : 'Details'}
              </th>
              <th className="text-right px-5 py-3 font-medium">
                {lang === 'zh' ? '時間' : 'Time'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                      log.status === 'success'
                        ? 'bg-green-900/30 text-green-400'
                        : log.status === 'failed'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    <span>
                      {log.status === 'success' ? '✓' : log.status === 'failed' ? '✗' : '⟳'}
                    </span>
                    {log.status === 'success'
                      ? lang === 'zh' ? '成功' : 'Success'
                      : log.status === 'failed'
                      ? lang === 'zh' ? '失敗' : 'Failed'
                      : lang === 'zh' ? '執行中' : 'Running'}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-300 text-xs max-w-32 truncate">
                  {log.ruleName}
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs max-w-40 truncate">
                  {log.action}
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs text-gray-500">{log.tool}</span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500 max-w-48 truncate">
                  {log.details}
                </td>
                <td className="px-5 py-4 text-right text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString(lang === 'zh' ? 'zh-TW' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
