import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Compass, 
  BarChart3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';
import Header from './components/Header';
import JobIntakeModal from './components/JobIntakeModal';
import DiscoveryPanel from './components/DiscoveryPanel';
import EmailOutreachModal from './components/EmailOutreachModal';
import QuoteIngestionModal from './components/QuoteIngestionModal';
import ComparisonMatrix from './components/ComparisonMatrix';
import WorkflowModal from './components/WorkflowModal';

export default function App() {
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [providers, setProviders] = useState([]);
  const [discoveryLinks, setDiscoveryLinks] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [activeTab, setActiveTab] = useState('discovery'); // 'discovery' | 'matrix'
  const [loading, setLoading] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(null); // { active: bool, step: string }

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [outreachModal, setOutreachModal] = useState({ isOpen: false, provider: null });
  const [ingestModal, setIngestModal] = useState({ isOpen: false, provider: null });

  // Initial Load
  useEffect(() => {
    fetchHealth();
    fetchJobs();
  }, []);

  // When selected job changes, fetch its providers & matrix
  useEffect(() => {
    if (selectedJob?.id) {
      fetchJobDetails(selectedJob.id);
    }
  }, [selectedJob?.id]);

  const fetchHealth = async () => {
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get('/api/jobs');
      setJobs(res.data);
      if (res.data.length > 0) {
        setSelectedJob(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchJobDetails = async (jobId) => {
    setLoading(true);
    try {
      // 1. Providers
      const provRes = await axios.get(`/api/jobs/${jobId}/providers`);
      setProviders(provRes.data);

      // If no providers yet, trigger discovery
      if (provRes.data.length === 0) {
        const discRes = await axios.post(`/api/jobs/${jobId}/discover`);
        setProviders(discRes.data.providers || []);
        setDiscoveryLinks(discRes.data.discoveryLinks || null);
      }

      // 2. Matrix
      const matrixRes = await axios.get(`/api/jobs/${jobId}/matrix`);
      setMatrix(matrixRes.data.matrix || []);

      // If matrix already has quotes, default to matrix tab so the user sees results immediately
      if (matrixRes.data.matrix && matrixRes.data.matrix.length > 0) {
        setActiveTab('matrix');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAutoPipeline = async (jobId) => {
    const targetId = jobId || selectedJob?.id;
    if (!targetId) return;

    setLoading(true);
    setPipelineProgress({ active: true, step: '1/4: Scouting local contractors in ZIP...' });

    try {
      await new Promise(r => setTimeout(r, 600));
      setPipelineProgress({ active: true, step: '2/4: Scanning local coupons & diagnostic specials...' });

      await new Promise(r => setTimeout(r, 600));
      setPipelineProgress({ active: true, step: '3/4: Generating RFQ inquiries with tracking codes...' });

      const res = await axios.post(`/api/jobs/${targetId}/auto-pipeline`);

      await new Promise(r => setTimeout(r, 600));
      setPipelineProgress({ active: true, step: '4/4: Scoring quotes in Comparison Matrix...' });

      setProviders(res.data.providers || []);
      setMatrix(res.data.matrix || []);
      if (res.data.discoveryLinks) setDiscoveryLinks(res.data.discoveryLinks);

      await new Promise(r => setTimeout(r, 400));
      setPipelineProgress(null);
      setActiveTab('matrix'); // Automatically show the scored comparison matrix!
    } catch (err) {
      console.error('Auto pipeline error:', err);
      setPipelineProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (formData) => {
    try {
      const res = await axios.post('/api/jobs', formData);
      setJobs([res.data, ...jobs]);
      setSelectedJob(res.data);
      // Automatically launch the end-to-end pipeline so quotes are collected & compared immediately!
      runAutoPipeline(res.data.id);
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this service request?')) return;
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      const updated = jobs.filter(j => j.id !== jobId);
      setJobs(updated);
      setSelectedJob(updated[0] || null);
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleRefreshDiscovery = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/jobs/${selectedJob.id}/discover`);
      setProviders(res.data.providers || []);
      setDiscoveryLinks(res.data.discoveryLinks || null);
    } catch (err) {
      console.error('Error refreshing discovery:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header health={health} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} />

      {/* Live Pipeline Progress Banner */}
      {pipelineProgress?.active && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold py-2.5 px-6 shadow-md transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 animate-bounce text-amber-300" />
              <span>Automated Pipeline Running: {pipelineProgress.step}</span>
            </div>
            <div className="w-32 bg-blue-900/50 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-300 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {/* Top Control Bar: Active Project Selector & New Project */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {selectedJob ? selectedJob.title : 'No Project Selected'}
              </h2>
              {selectedJob && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  ZIP {selectedJob.zipCode}
                </span>
              )}
            </div>
            {selectedJob && (
              <p className="text-xs text-slate-400 mt-1 max-w-xl truncate">
                {selectedJob.symptoms || selectedJob.serviceType}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Project Dropdown if multiple */}
            {jobs.length > 1 && (
              <select
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  const job = jobs.find(j => j.id === e.target.value);
                  if (job) setSelectedJob(job);
                }}
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.zipCode})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => runAutoPipeline()}
              disabled={loading || !selectedJob}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Pilot Pipeline</span>
            </button>

            <button
              onClick={() => setIsJobModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 mb-6 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'discovery'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>1. Discovered Contractors &amp; Deals</span>
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
              {providers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>2. Comparison &amp; Decision Matrix</span>
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              {matrix.length} Quotes
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'discovery' ? (
          <DiscoveryPanel
            job={selectedJob}
            providers={providers}
            discoveryLinks={discoveryLinks}
            loading={loading}
            onRefreshDiscovery={handleRefreshDiscovery}
            onRunAutoPipeline={() => runAutoPipeline()}
            onOpenOutreach={(provider) => setOutreachModal({ isOpen: true, provider })}
            onOpenIngest={(provider) => setIngestModal({ isOpen: true, provider })}
          />
        ) : (
          <ComparisonMatrix matrix={matrix} job={selectedJob} />
        )}
      </main>

      {/* Modals */}
      <JobIntakeModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onCreateJob={handleCreateJob}
      />

      <EmailOutreachModal
        isOpen={outreachModal.isOpen}
        onClose={() => setOutreachModal({ isOpen: false, provider: null })}
        job={selectedJob}
        provider={outreachModal.provider}
        onOutreachSent={() => selectedJob && fetchJobDetails(selectedJob.id)}
      />

      <QuoteIngestionModal
        isOpen={ingestModal.isOpen}
        onClose={() => setIngestModal({ isOpen: false, provider: null })}
        job={selectedJob}
        provider={ingestModal.provider}
        onQuoteSaved={() => {
          if (selectedJob) fetchJobDetails(selectedJob.id);
          setActiveTab('matrix');
        }}
      />

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
      />
    </div>
  );
}
