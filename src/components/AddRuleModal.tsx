'use client';

import { useState } from 'react';
import { useApp } from '@/app/page';
import { TRIGGERS } from '@/lib/types';

interface AddRuleModalProps {
  onClose: () => void;
}

interface ParsedRule {
  trigger: string;
  condition: string;
  action: string;
  name: string;
}

export default function AddRuleModal({ onClose }: AddRuleModalProps) {
  const { lang } = useApp();
  const [step, setStep] = useState(1);
  const [naturalRule, setNaturalRule] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedRule | null>(null);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!naturalRule.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: naturalRule.slice(0, 50),
          trigger: 'scheduled',
          condition: JSON.stringify({ text: naturalRule }),
          action: JSON.stringify({ text: naturalRule }),
          schedule: '0 9 * * *',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setParsed({
          trigger: 'scheduled',
          condition: naturalRule,
          action: naturalRule,
          name: naturalRule.slice(0, 50),
        });
        setStep(2);
      } else {
        setError(lang === 'zh' ? '建立規則失敗，請重試' : 'Failed to create rule, please retry');
      }
    } catch {
      setError(lang === 'zh' ? '網路錯誤' : 'Network error');
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!parsed) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name,
          trigger: parsed.trigger,
          condition: JSON.stringify({ text: parsed.condition }),
          action: JSON.stringify({ text: parsed.action }),
        }),
      });

      if (!res.ok) {
        setError(lang === 'zh' ? '建立規則失敗' : 'Failed to create rule');
        setLoading(false);
        return;
      }
      onClose();
      window.location.reload();
    } catch {
      setError(lang === 'zh' ? '網路錯誤' : 'Network error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-white">
              {lang === 'zh' ? '新增自動化規則' : 'Create Automation Rule'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === 1
                ? lang === 'zh' ? '用自然語言描述你的規則' : 'Describe your rule in natural language'
                : lang === 'zh' ? '確認規則內容' : 'Confirm rule details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= s ? 'bg-indigo-600' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        <div className="p-6">
          {step === 1 ? (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800 text-xs text-red-400">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">
                  {lang === 'zh' ? '用自然語言描述你的規則' : 'Describe your rule in natural language'}
                </label>
                <textarea
                  value={naturalRule}
                  onChange={(e) => setNaturalRule(e.target.value)}
                  placeholder={
                    lang === 'zh'
                      ? '例如：每次會議結束後自動寄摘要到 Slack'
                      : 'e.g., Every time a meeting ends, send a summary to Slack'
                  }
                  className="w-full h-32 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">
                  {lang === 'zh' ? '或選擇觸發條件：' : 'Or choose a trigger:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRIGGERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setNaturalRule(
                          lang === 'zh'
                            ? `每次${t.nameZh}時，自動執行...`
                            : `Every time ${t.name.toLowerCase()}, automatically...`
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <span>{t.icon}</span>
                      <span>{lang === 'zh' ? t.nameZh : t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleParse}
                disabled={!naturalRule.trim() || loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    {lang === 'zh' ? '建立規則中...' : 'Creating rule...'}
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    {lang === 'zh' ? '建立規則' : 'Create Rule'}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3 mb-5">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-xs text-indigo-400 font-medium mb-1">IF</div>
                  <div className="text-sm text-gray-200">{parsed?.condition}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-xs text-emerald-400 font-medium mb-1">THEN</div>
                  <div className="text-sm text-gray-200">{parsed?.action}</div>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-medium rounded-xl transition-colors"
                >
                  {lang === 'zh' ? '← 修改' : '← Edit'}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <>
                      <span>✓</span>
                      {lang === 'zh' ? '建立規則' : 'Create Rule'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
