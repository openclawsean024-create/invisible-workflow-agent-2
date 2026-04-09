'use client';

import { useApp } from '@/app/page';

interface TopBarProps {
  onAddRule: () => void;
}

export default function TopBar({ onAddRule }: TopBarProps) {
  const { lang, setLang, activeTab } = useApp();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {lang === 'zh' ? 'Invisible Workflow Agent' : 'Invisible Workflow Agent'}
            </h1>
            <p className="text-xs text-gray-400 leading-tight">
              {lang === 'zh' ? '智慧工作流程自動化' : 'Smart Workflow Automation'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-800">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">
            {lang === 'zh' ? '運行中' : 'Running'}
          </span>
        </div>

        {/* Add Rule button */}
        <button
          onClick={onAddRule}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>+</span>
          <span>{lang === 'zh' ? '新增規則' : 'Add Rule'}</span>
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
        >
          <span className={lang === 'zh' ? 'text-white' : 'text-gray-500'}>中</span>
          <span className="text-gray-600">/</span>
          <span className={lang === 'en' ? 'text-white' : 'text-gray-500'}>EN</span>
        </button>
      </div>
    </header>
  );
}
