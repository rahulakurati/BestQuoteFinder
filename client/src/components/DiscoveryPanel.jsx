import React from 'react';
import { 
  Compass, 
  ExternalLink, 
  Tag, 
  Mail, 
  FileCheck2, 
  Star, 
  MapPin, 
  Phone, 
  CheckCircle,
  RefreshCw,
  Search
} from 'lucide-react';

export default function DiscoveryPanel({ 
  job, 
  providers, 
  discoveryLinks, 
  loading, 
  onRefreshDiscovery, 
  onOpenOutreach, 
  onOpenIngest 
}) {
  if (!job) return null;

  return (
    <div className="space-y-6">
      {/* 1. Multi-Channel External Hub Links */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Multi-Source Direct Links ({job.serviceType} in {job.zipCode})</span>
            </h3>
            <p className="text-xs text-slate-400">Open curated search links in your browser to inspect local listings &amp; groups.</p>
          </div>
          <button
            onClick={onRefreshDiscovery}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Scout Deals &amp; Providers</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {discoveryLinks?.googleMaps && (
            <a
              href={discoveryLinks.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition group"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Google Maps</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition" />
            </a>
          )}

          {discoveryLinks?.thumbtack && (
            <a
              href={discoveryLinks.thumbtack}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition group"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Thumbtack</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition" />
            </a>
          )}

          {discoveryLinks?.facebookMarketplace && (
            <a
              href={discoveryLinks.facebookMarketplace}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition group"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>FB Marketplace</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition" />
            </a>
          )}

          {discoveryLinks?.facebookGroups && (
            <a
              href={discoveryLinks.facebookGroups}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition group"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Local FB Groups</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
            </a>
          )}
        </div>
      </div>

      {/* 2. Discovered Providers & Coupons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Discovered Contractors &amp; Deals</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {providers.length} Available
            </span>
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No contractors discovered yet</p>
            <p className="text-xs text-slate-500 mt-1">Click "Scout Deals &amp; Providers" to discover local companies and promos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const promo = p.promotions?.[0];
              const isContacted = p.status === 'contacted';
              const isQuoted = p.status === 'quoted';

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{p.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                            {p.source}
                          </span>
                          <span className="flex items-center text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                            {p.rating}
                          </span>
                          <span>({p.reviewCount} reviews)</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isQuoted ? (
                        <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          Quote Received
                        </span>
                      ) : isContacted ? (
                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Contacted
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                          Ready for RFQ
                        </span>
                      )}
                    </div>

                    {/* Contact & Location */}
                    <div className="space-y-1 my-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{p.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{p.phone || 'Phone on site'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-300">{p.email}</span>
                      </div>
                    </div>

                    {/* Promo Box */}
                    {promo && (
                      <div className="mb-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{promo.title}</span>
                          <span className="ml-auto font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                            {promo.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400/80 mt-1">{promo.terms}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenOutreach(p)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isContacted
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{isContacted ? 'Resend RFQ' : 'Request Quote'}</span>
                    </button>

                    <button
                      onClick={() => onOpenIngest(p)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1 transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Log Quote</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
