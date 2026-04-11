'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { Language } from '@/lib/types';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ToolsPanel from '@/components/ToolsPanel';
import RulesPanel from '@/components/RulesPanel';
import LogsPanel from '@/components/LogsPanel';
import AddRuleModal from '@/components/AddRuleModal';

async function fetchTasks() {
  return [{ id: 1, name: '建立 API', status: 'done' }, { id: 2, name: '串接資料儲存', status: 'pending' }];
}


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
  const [tasks, setTasks] = useState<Array<{ id: number; name: string; status: string }>>([]);

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);

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
            {activeTab === 'tools' && (
              <div className="mt-4 rounded-lg border border-gray-800 p-4">
                <h2 className="mb-3 text-lg font-semibold">後端 API 狀態</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                  {tasks.map(task => (
                    <li key={task.id} className="flex items-center justify-between">
                      <span>{task.name}</span>
                      <span className="text-xs text-gray-500">{task.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </main>
        </div>
        {showAddRule && <AddRuleModal onClose={() => setShowAddRule(false)} />}
      </div>
    </AppContext.Provider>
  );
}
