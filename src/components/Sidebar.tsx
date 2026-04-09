'use client';

import { useApp } from '@/app/page';

const tabs = [
  { id: 'dashboard', icon: '📊', zh: '儀表板', en: 'Dashboard' },
  { id: 'tools', icon: '🔗', zh: '工具串接', en: 'Tools' },
  { id: 'rules', icon: '⚙️', zh: '規則引擎', en: 'Rules' },
  { id: 'logs', icon: '📋', zh: '操作日誌', en: 'Logs' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, lang } = useApp();

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex-shrink-0 flex flex-col">
      <nav className="flex-1 py-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-400 border-r-2 border-indigo-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{lang === 'zh' ? tab.zh : tab.en}</span>
          </button>
        ))}
      </nav>

      {/* Footer stats */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>{lang === 'zh' ? '活躍規則' : 'Active Rules'}</span>
            <span className="text-indigo-400 font-medium">2</span>
          </div>
          <div className="flex justify-between">
            <span>{lang === 'zh' ? '執行成功率' : 'Success Rate'}</span>
            <span className="text-green-400 font-medium">95%</span>
          </div>
          <div className="flex justify-between">
            <span>{lang === 'zh' ? '節省時間/週' : 'Saved/Week'}</span>
            <span className="text-yellow-400 font-medium">3h</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
