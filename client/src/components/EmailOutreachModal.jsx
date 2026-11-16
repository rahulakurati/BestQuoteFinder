import React, { useState, useEffect } from 'react';
import { X, Mail, Send, ExternalLink, Check, Copy } from 'lucide-react';
import axios from 'axios';

export default function EmailOutreachModal({ isOpen, onClose, job, provider, onOutreachSent }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen && job && provider) {
      loadPreview();
    } else {
      setPreview(null);
      setStatusMessage(null);
    }
  }, [isOpen, job, provider]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/jobs/${job.id}/outreach/preview`, {
        providerId: provider.id
      });
      setPreview(res.data);
    } catch (err) {
      console.error('Error fetching preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    setStatusMessage(null);
    try {
      const res = await axios.post(`/api/jobs/${job.id}/outreach/send`, {
        providerId: provider.id
      });

      if (res.data.mode === 'smtp_sent') {
        setStatusMessage({ type: 'success', text: `Email dispatched successfully! Message ID: ${res.data.messageId}` });
      } else {
        setStatusMessage({ 
          type: 'info', 
          text: 'SMTP credentials not configured in .env. Click "Open in Email Client" to send via your desktop/webmail.' 
        });
      }
      onOutreachSent();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (preview?.body) {
      navigator.clipboard.writeText(preview.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !provider) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Send RFQ to {provider.name}</h2>
            <p className="text-xs text-slate-400">Recipient: <span className="text-slate-200 font-mono">{provider.email}</span></p>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-lg text-xs mb-4 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Generating standardized RFQ...</div>
        ) : preview ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Subject Line (With Tracking ID)
              </label>
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono select-all">
                {preview.subject}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email Body
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={10}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 font-mono leading-relaxed select-all"
                value={preview.body}
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <a
                href={preview.mailtoUri}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Open in Email App (1-Click)</span>
              </a>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Close
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Sending...' : 'Send via SMTP'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
