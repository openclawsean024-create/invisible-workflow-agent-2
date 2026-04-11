'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/app/page';
import { Rule, TRIGGERS } from '@/lib/types';

interface RulesPanelProps {
  onAddRule: () => void;
}

interface RuleAPI {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  schedule?: string;
  enabled: boolean;
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  createdAt: string;
}

export default function RulesPanel({ onAddRule }: RulesPanelProps) {
  const { lang } = useApp();
  const [rules, setRules] = useState<Rule[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rules')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.rules) {
          const mapped: Rule[] = d.rules.map((r: RuleAPI) => ({
            id: r.id,
            name: r.name,
            nameZh: r.name,
            trigger: r.trigger,
            triggerZh: TRIGGERS.find((t) => t.id === r.trigger)?.nameZh ?? r.trigger,
            condition: r.condition,
            conditionZh: r.condition,
            action: r.action,
            actionZh: r.action,
            enabled: r.enabled,
            schedule: r.schedule,
            scheduleZh: r.schedule,
            lastRun: r.lastRunAt,
            runCount: r.runCount,
            successCount: r.successCount,
            createdAt: r.createdAt,
          }));
          setRules(mapped);
        } else {
          setRules([]);
        }
      })
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleRule = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: data.rule.enabled } : r));
      }
    } catch {}
  };

  const filtered = rules.filter((r) => {
    if (filter === 'active') return r.enabled;
    if (filter === 'paused') return !r.enabled;
    return true;
  });

  const getTriggerIcon = (triggerId: string) =>
    TRIGGERS.find((t) => t.id === triggerId)?.icon ?? '⚡';

  const getTriggerName = (rule: Rule) => {
    const t = TRIGGERS.find((tr) => tr.id === rule.trigger);
    return lang === 'zh' ? (t?.nameZh ?? rule.trigger) : (t?.name ?? rule.trigger);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {lang === 'zh' ? '規則引擎' : 'Rule Engine'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {lang === 'zh' ? '設定 IF-THEN 自動化規則' : 'Configure IF-THEN automation rules'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
            {[
              { id: 'all', zh: '全部', en: 'All' },
              { id: 'active', zh: '運行中', en: 'Active' },
              { id: 'paused', zh: '已暫停', en: 'Paused' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lang === 'zh' ? f.zh : f.en}
              </button>
            ))}
          </div>
          <button
            onClick={onAddRule}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span>+</span>
            <span>{lang === 'zh' ? '新增規則' : 'Add Rule'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <span className="animate-pulse">{lang === 'zh' ? '載入中...' : 'Loading...'}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-sm">{lang === 'zh' ? '還沒有規則' : 'No rules yet'}</div>
          <button
            onClick={onAddRule}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
          >
            {lang === 'zh' ? '建立第一條規則 →' : 'Create your first rule →'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rule) => (
            <div
              key={rule.id}
              className={`border rounded-xl p-5 transition-colors ${
                rule.enabled
                  ? 'bg-gray-900 border-gray-800'
                  : 'bg-gray-900/50 border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getTriggerIcon(rule.trigger)}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {lang === 'zh' ? rule.nameZh : rule.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {lang === 'zh' ? '觸發：' : 'Trigger: '}{getTriggerName(rule)}
                      {rule.schedule && (
                        <span className="ml-2 font-mono text-indigo-400">
                          ⏰ {rule.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className="text-xs text-gray-500">
                      {rule.runCount} {lang === 'zh' ? '次執行' : 'runs'}
                    </div>
                    <div className="text-xs text-green-400">
                      {rule.runCount > 0 ? Math.round((rule.successCount / rule.runCount) * 100) : 0}% {lang === 'zh' ? '成功' : 'success'}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      rule.enabled ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 text-xs mb-3">
                <div className="text-gray-400 mb-1">
                  <span className="text-indigo-400 font-medium">IF</span>{' '}
                  {lang === 'zh' ? rule.conditionZh : rule.condition}
                </div>
                <div className="text-gray-400">
                  <span className="text-emerald-400 font-medium">THEN</span>{' '}
                  {lang === 'zh' ? rule.actionZh : rule.action}
                </div>
              </div>

              {rule.lastRun && (
                <div className="text-xs text-gray-500">
                  {lang === 'zh' ? '上次執行：' : 'Last run: '}
                  {new Date(rule.lastRun).toLocaleString(lang === 'zh' ? 'zh-TW' : 'en-US')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
