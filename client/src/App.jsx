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
  FileText
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
      if (res.data.length > 0 && !selectedJob) {
        setSelectedJob(res.data[0]);
      } else if (res.data.length === 0) {
        // Auto create a sample Water Heater Repair job on first launch
        createDefaultJob();
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const createDefaultJob = async () => {
    try {
      const res = await axios.post('/api/jobs', {
        title: 'Water Heater Replacement / Repair',
        serviceType: 'Water Heater Repair',
        zipCode: '94107',
        symptoms: 'Water heater stopped heating water. Pilot light off, small leak near base.',
        unitDetails: '50-Gallon Gas Rheem 2018',
        urgency: 'Urgent (Within 24 hours)',
        contactName: 'Homeowner'
      });
      setJobs([res.data]);
      setSelectedJob(res.data);
    } catch (err) {
      console.error('Error creating default job:', err);
    }
  };

  const fetchJobDetails = async (jobId) => {
    setLoading(true);
    try {
      // 1. Providers
      const provRes = await axios.get(`/api/jobs/${jobId}/providers`);
      setProviders(provRes.data);

      // If no providers yet, trigger auto-discovery
      if (provRes.data.length === 0) {
        const discRes = await axios.post(`/api/jobs/${jobId}/discover`);
        setProviders(discRes.data.providers || []);
        setDiscoveryLinks(discRes.data.discoveryLinks || null);
      }

      // 2. Matrix
      const matrixRes = await axios.get(`/api/jobs/${jobId}/matrix`);
      setMatrix(matrixRes.data.matrix || []);
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (formData) => {
    try {
      const res = await axios.post('/api/jobs', formData);
      setJobs([res.data, ...jobs]);
      setSelectedJob(res.data);
      // Auto trigger discovery for the new job
      const discRes = await axios.post(`/api/jobs/${res.data.id}/discover`);
      setProviders(discRes.data.providers || []);
      setDiscoveryLinks(discRes.data.discoveryLinks || null);
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this service project?')) return;
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
              onClick={() => setIsJobModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Service Request</span>
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
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
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
          setActiveTab('matrix'); // Switch to matrix automatically so user sees the scored quote
        }}
      />

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
      />
    </div>
  );
}
