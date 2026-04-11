'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function CreatePage() {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('schedule');
  const [action, setAction] = useState('email');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('請輸入規則名稱'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trigger, condition: '{}', action, enabled: true }),
      });
      if (!res.ok) throw new Error('儲存失敗');
      setSaved(true); setName('');
    } catch {
      setError('儲存失敗，請稍後重試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">建立工作流</h1>
          <p className="text-gray-400 text-sm mb-8">建立新的自動化工作流程規則</p>

          {saved && (
            <div className="mb-6 p-4 rounded-xl bg-green-900/30 border border-green-800/30 text-green-400 text-sm">
              ✅ 規則已建立！
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">規則名稱</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：每日報告寄送"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">觸發條件</label>
                <select value={trigger} onChange={e => setTrigger(e.target.value)} className="input-field">
                  <option value="schedule">排程（每日/每週）</option>
                  <option value="webhook">Webhook</option>
                  <option value="event">事件觸發</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">執行動作</label>
                <select value={action} onChange={e => setAction(e.target.value)} className="input-field">
                  <option value="email">傳送 Email</option>
                  <option value="slack">Slack 通知</option>
                  <option value="notion">寫入 Notion</option>
                  <option value="calendar">建立行事曆事件</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full justify-center py-2.5"
              >
                {saving ? '儲存中...' : '建立規則'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
