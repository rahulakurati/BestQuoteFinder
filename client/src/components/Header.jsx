import React from 'react';
import { Layers, ShieldCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function Header({ health, onOpenWorkflow }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">BestQuoteFinder</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Phase 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Channel Service Discovery, Deals &amp; Quote Comparison</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Workflow Diagram button */}
          <button
            onClick={onOpenWorkflow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Workflow Diagram</span>
          </button>

          {/* Email Outreach Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Outreach:</span>
            {health?.emailConfigured ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SMTP Connected
              </span>
            ) : (
              <span className="text-amber-400 font-medium" title="Configure .env for automated SMTP or use 1-click mailto">
                1-Click Mailto Ready
              </span>
            )}
          </div>

          {/* Git Security Badge */}
          <div className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Git Safe (.env Protected)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
