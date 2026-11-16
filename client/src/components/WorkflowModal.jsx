import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

export default function WorkflowModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">System Workflow &amp; Architecture</h2>
          <p className="text-xs text-slate-400">
            Committed to <span className="font-mono text-slate-200">docs/workflow.svg</span> and <span className="font-mono text-slate-200">docs/architecture.md</span>
          </p>
        </div>

        {/* Embedded SVG preview */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto text-center">
          <img 
            src="/docs/workflow.svg" 
            alt="BestQuoteFinder Architecture Diagram" 
            className="w-full max-h-[480px] object-contain mx-auto rounded"
            onError={(e) => {
              // fallback if static serving path differs in dev
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <div style={{ display: 'none' }} className="py-8 text-xs text-slate-400">
            Workflow diagram committed at <span className="font-mono text-blue-400">docs/workflow.svg</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Git &amp; Secrets Protection:</strong> All Facebook, Thumbtack, and Google tokens remain in <code className="text-white">.env</code> and will never be committed to Git.
          </span>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
