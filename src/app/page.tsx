'use client';

import { useState, createContext, useContext } from 'react';
import { Language } from '@/lib/types';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ToolsPanel from '@/components/ToolsPanel';
import RulesPanel from '@/components/RulesPanel';
import LogsPanel from '@/components/LogsPanel';
import AddRuleModal from '@/components/AddRuleModal';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const AppContext = createContext<AppContextType>({
  lang: 'zh',
  setLang: () => {},
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export default function Home() {
  const [lang, setLang] = useState<Language>('zh');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddRule, setShowAddRule] = useState(false);

  return (
    <AppContext.Provider value={{ lang, setLang, activeTab, setActiveTab }}>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <TopBar onAddRule={() => setShowAddRule(true)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'tools' && <ToolsPanel />}
            {activeTab === 'rules' && <RulesPanel onAddRule={() => setShowAddRule(true)} />}
            {activeTab === 'logs' && <LogsPanel />}
          </main>
        </div>
        {showAddRule && <AddRuleModal onClose={() => setShowAddRule(false)} />}
      </div>
    </AppContext.Provider>
  );
}
