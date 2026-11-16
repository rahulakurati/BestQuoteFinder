import React, { useState } from 'react';
import { 
  Trophy, 
  Zap, 
  DollarSign, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Tag, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export default function ComparisonMatrix({ matrix, job }) {
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [hiredProvider, setHiredProvider] = useState(null);

  if (!matrix || matrix.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <TrendingDown className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">No Quotes Ingested Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Send RFQs to discovered contractors or paste incoming quotes using "Log Quote". The comparison matrix and reasoning engine will rank them here.
        </p>
      </div>
    );
  }

  const topPick = matrix[0];

  return (
    <div className="space-y-6">
      {/* Top AI Pick Banner */}
      {topPick && (
        <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  Recommended Best Overall Value
                </span>
                <span className="text-xs text-slate-400">Score: {topPick.scores.overall}/100</span>
              </div>
              <h3 className="text-lg font-bold text-white">{topPick.providerName}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Offers the most cost-effective balance: <strong className="text-white">${topPick.diagnosticFee} diagnostic fee</strong>{' '}
                {topPick.diagnosticCredited ? <span className="text-emerald-400">(credited towards repair)</span> : ''},{' '}
                estimated repair range of <strong className="text-white">${topPick.estimatedTotalMin} - ${topPick.estimatedTotalMax}</strong>,{' '}
                availability <strong className="text-white">{topPick.earliestAvailability}</strong>, and backed by{' '}
                <strong className="text-white">{topPick.warrantyLabor}</strong>.
              </p>
            </div>

            <button
              onClick={() => setHiredProvider(topPick.providerName)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-1.5"
            >
              <span>{hiredProvider === topPick.providerName ? 'Selected for Hire' : 'Hire Best Value'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matrix.map((q, idx) => {
          const isSelected = selectedQuoteId === q.id;
          const isTop = idx === 0;

          return (
            <div
              key={q.id}
              onClick={() => setSelectedQuoteId(q.id)}
              className={`rounded-xl p-5 border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500 shadow-xl'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {q.badges?.map((badge, bIdx) => (
                    <span
                      key={bIdx}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        badge.type === 'gold'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : badge.type === 'cyan'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : badge.type === 'green'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {badge.label}
                    </span>
                  ))}
                  <span className="ml-auto text-xs font-bold text-slate-300">
                    Rank #{idx + 1}
                  </span>
                </div>

                {/* Contractor Name */}
                <h4 className="text-base font-bold text-white mb-1">{q.providerName}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <span className="flex items-center text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                    {q.provider?.rating || 4.5}
                  </span>
                  <span>({q.provider?.reviewCount || 30} reviews)</span>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2.5 text-xs border-t border-slate-800 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Diagnostic Fee:</span>
                    <span className="font-semibold text-white">
                      ${q.diagnosticFee}{' '}
                      {q.diagnosticCredited && (
                        <span className="text-[10px] text-emerald-400 font-medium">(Waived)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Repair Estimate:</span>
                    <span className="font-bold text-white">
                      ${q.estimatedTotalMin} - ${q.estimatedTotalMax}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Arrival Window:</span>
                    <span className="font-medium text-slate-200">{q.earliestAvailability}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Labor Warranty:</span>
                    <span className="font-medium text-slate-200">{q.warrantyLabor}</span>
                  </div>

                  {q.promoApplied && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span className="truncate">{q.promoApplied}</span>
                    </div>
                  )}
                </div>

                {/* Score Breakdown Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Overall Match Score</span>
                    <span className="font-bold text-blue-400">{q.scores.overall}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isTop ? 'bg-amber-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${q.scores.overall}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiredProvider(q.providerName);
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                    hiredProvider === q.providerName
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {hiredProvider === q.providerName ? 'Selected Provider' : 'Select Provider'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Banner */}
      {hiredProvider && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              You have selected <strong>{hiredProvider}</strong>! You can now reply to their RFQ thread to confirm the appointment.
            </span>
          </div>
          <button
            onClick={() => setHiredProvider(null)}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
