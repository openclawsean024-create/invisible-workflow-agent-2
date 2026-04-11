'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/app/page';
import { TOOLS, Tool } from '@/lib/types';

interface ToolAPI {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
  descriptionZh: string;
  connected: boolean;
  account?: string;
  connectedAt?: string;
  lastSync?: string;
}

export default function ToolsPanel() {
  const { lang } = useApp();
  const [tools, setTools] = useState<Tool[]>(TOOLS);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tools')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.tools) {
          setTools(d.tools as Tool[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (toolId: string) => {
    setConnecting(toolId);
    try {
      const res = await fetch(`/api/tools/${toolId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          // Redirect to OAuth provider
          window.location.href = data.authUrl;
          return;
        }
      }
    } catch {}
    setConnecting(null);
  };

  const handleDisconnect = async (toolId: string) => {
    setConnecting(toolId);
    try {
      const res = await fetch(`/api/tools/${toolId}`, { method: 'DELETE' });
      if (res.ok) {
        setTools((prev) => prev.map((t) => t.id === toolId ? { ...t, connected: false, account: undefined } : t));
      }
    } catch {}
    setConnecting(null);
  };

  const connectedCount = tools.filter((t) => t.connected).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {lang === 'zh' ? '工具串接' : 'Tool Integrations'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {lang === 'zh'
            ? `已連接 ${connectedCount}/${tools.length} 個工具`
            : `${connectedCount}/${tools.length} tools connected`}
        </p>
      </div>

      {connectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-900/20 border border-green-800 text-sm">
          <span className="text-green-400">●</span>
          <span className="text-green-300">
            {lang === 'zh'
              ? `${connectedCount} 個工具已連接，Agent 可以開始自動化工作`
              : `${connectedCount} tools connected — Agent is ready to automate`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-gray-800 rounded-xl p-5 bg-gray-900 animate-pulse">
              <div className="h-24 bg-gray-800 rounded" />
            </div>
          ))
        ) : (
          tools.map((tool) => (
            <div
              key={tool.id}
              className={`border rounded-xl p-5 transition-colors ${
                tool.connected
                  ? 'bg-indigo-900/20 border-indigo-800'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{tool.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {lang === 'zh' ? tool.nameZh : tool.name}
                    </div>
                    <div className="text-xs text-gray-500">{tool.id}</div>
                    {(tool as ToolAPI).account && (
                      <div className="text-xs text-green-400 mt-0.5">
                        {(tool as ToolAPI).account}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  tool.connected ? 'bg-green-400' : 'bg-gray-600'
                }`} />
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                {lang === 'zh' ? tool.descriptionZh : tool.description}
              </p>
              <button
                onClick={() => tool.connected ? handleDisconnect(tool.id) : handleConnect(tool.id)}
                disabled={connecting === tool.id}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                  tool.connected
                    ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                } disabled:opacity-50`}
              >
                {connecting === tool.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span>
                    {lang === 'zh' ? '處理中...' : 'Processing...'}
                  </span>
                ) : tool.connected ? (
                  lang === 'zh' ? '中斷連接' : 'Disconnect'
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <span>🔗</span>
                    {lang === 'zh' ? '連接到 ' : 'Connect '}{lang === 'zh' ? tool.nameZh : tool.name}
                  </span>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">
          {lang === 'zh' ? 'OAuth2 安全說明' : 'OAuth2 Security Note'}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {lang === 'zh'
            ? '所有工具串接使用 OAuth2 授權，一次授權即可永久使用。我們不會儲存您的密碼，所有憑證都由各平台安全托管。'
            : 'All integrations use OAuth2 authorization — connect once, use forever. We never store passwords; credentials are securely managed by each platform.'}
        </p>
      </div>
    </div>
  );
}
