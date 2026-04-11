'use client';

export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-lg">⚡</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Invisible Workflow Agent</h1>
          <p className="text-xs text-gray-400 leading-tight">智慧工作流程自動化</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-gray-500">v1.0 — 演示模式</span>
      </div>
    </header>
  );
}
