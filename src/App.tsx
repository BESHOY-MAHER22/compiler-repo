import React, { useState } from 'react';
import { RynixScannerIDE } from './components/RynixScannerIDE';
import { DocumentationView } from './components/DocumentationView';
import { JasonCompilerView } from './components/JasonCompilerView';
import { Sparkles, FileText, Code2, Cpu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'rynix-scanner' | 'documentation' | 'jason-template'>('rynix-scanner');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Top Main Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 select-none z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-md shadow-blue-500/20">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">
              Compilers Studio
            </span>
            <span className="ml-2 text-xs text-slate-400 hidden sm:inline">
              Rynix Language & JASON Compiler
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setCurrentView('rynix-scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              currentView === 'rynix-scanner'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rynix Scanner (Milestone 1)</span>
          </button>

          <button
            onClick={() => setCurrentView('documentation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              currentView === 'documentation'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A4 Documentation & DFAs</span>
          </button>

          <button
            onClick={() => setCurrentView('jason-template')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              currentView === 'jason-template'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>JASON Template (Form 1 & 2)</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {currentView === 'rynix-scanner' && (
          <RynixScannerIDE onOpenDoc={() => setCurrentView('documentation')} />
        )}
        {currentView === 'documentation' && (
          <DocumentationView onBack={() => setCurrentView('rynix-scanner')} />
        )}
        {currentView === 'jason-template' && (
          <JasonCompilerView />
        )}
      </main>
    </div>
  );
}
