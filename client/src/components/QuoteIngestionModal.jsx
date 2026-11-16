import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function QuoteIngestionModal({ isOpen, onClose, job, provider, onQuoteSaved }) {
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !provider) return null;

  // Pre-fill realistic sample text for fast testing
  const handleLoadSample = (sampleType) => {
    if (sampleType === 'cheap') {
      setRawText(`Hi, thanks for reaching out. Our diagnostic fee is $29, but it is completely waived if you proceed with the repair. For a typical pilot assembly or thermocouple issue on a Rheem gas unit, parts and labor usually run between $180 to $260. We have an opening tomorrow morning between 9 AM and 12 PM. We offer 90 days warranty on labor and 1 year on parts. Also we honor your $29 diagnostic coupon.`);
    } else if (sampleType === 'fast') {
      setRawText(`Hello! We have an emergency technician in 94107 right now and can arrive within 2-4 hours today. Our dispatch and diagnostic fee is $89 (does not apply to repair). Total repair estimate is typically $250 - $400 depending on parts needed. We provide a full 1-year warranty on all labor and parts.`);
    } else {
      setRawText(`Good afternoon, our diagnostic is $49, which gets applied directly toward the repair cost if hired. Total repair estimate usually ranges between $220 to $320. Earliest arrival is Thursday afternoon. We provide 6 months labor warranty.`);
    }
  };

  const handleParseAndSave = async () => {
    if (!rawText.trim()) return;
    setSaving(true);
    try {
      const res = await axios.post(`/api/jobs/${job.id}/quotes/parse`, {
        providerId: provider.id,
        rawText
      });
      setParsedPreview(res.data);
      onQuoteSaved();
      setTimeout(() => {
        onClose();
        setParsedPreview(null);
        setRawText('');
      }, 1000);
    } catch (err) {
      console.error('Error parsing quote:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Log Contractor Quote / Response</h2>
            <p className="text-xs text-slate-400">Contractor: <span className="text-white font-semibold">{provider.name}</span></p>
          </div>
        </div>

        {/* Quick Sample Fill for demo testing */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-slate-400 font-medium">Quick Sample:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('cheap')}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition"
          >
            $29 Waived Diagnostic
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('fast')}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
          >
            Same-Day Emergency
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Paste Email Reply / Quote Message:
            </label>
            <textarea
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste contractor's email response, SMS, or quote breakdown here..."
            />
          </div>

          {parsedPreview && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Extracted &amp; Saved Successfully!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Diagnostic: <span className="font-semibold text-white">${parsedPreview.diagnosticFee} {parsedPreview.diagnosticCredited ? '(Waived if repaired)' : ''}</span></div>
                <div>Estimate: <span className="font-semibold text-white">${parsedPreview.estimatedTotalMin} - ${parsedPreview.estimatedTotalMax}</span></div>
                <div>Arrival: <span className="font-semibold text-white">{parsedPreview.earliestAvailability}</span></div>
                <div>Warranty: <span className="font-semibold text-white">{parsedPreview.warrantyLabor}</span></div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!rawText.trim() || saving}
              onClick={handleParseAndSave}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{saving ? 'Analyzing Quote...' : 'Parse & Add to Matrix'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
