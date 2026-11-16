import React, { useState } from 'react';
import { X, Wrench, MapPin, AlertCircle, Sparkles } from 'lucide-react';

export default function JobIntakeModal({ isOpen, onClose, onCreateJob }) {
  const [formData, setFormData] = useState({
    serviceType: 'Water Heater Repair',
    zipCode: '94107',
    symptoms: 'Water heater stopped producing hot water. Pilot light appears off and small leak around bottom drain valve.',
    unitDetails: '50-Gallon Natural Gas, Rheem Performance Platinum (Installed ~2019)',
    urgency: 'Urgent (Within 24 hours)',
    contactName: 'Homeowner',
    contactEmail: '',
    contactPhone: '(555) 019-2834'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.zipCode) return;
    onCreateJob(formData);
    onClose();
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

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create Service Request &amp; RFQ</h2>
            <p className="text-xs text-slate-400">Enter the issue details once to generate targeted discovery and RFQs.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Service Type / Trade *
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g. Water Heater Repair, HVAC"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ZIP Code *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="e.g. 94107"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Issue Symptoms &amp; Description
            </label>
            <textarea
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="Describe symptoms, strange noises, error codes, leaks..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit Details (Brand/Capacity/Fuel)
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={formData.unitDetails}
                onChange={(e) => setFormData({ ...formData, unitDetails: e.target.value })}
                placeholder="e.g. 50 Gal Gas Rheem 2019"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Urgency Level
              </label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              >
                <option value="Emergency (Same Day / ASAP)">Emergency (Same Day / ASAP)</option>
                <option value="Urgent (Within 24 hours)">Urgent (Within 24 hours)</option>
                <option value="Standard (Next 2-3 days)">Standard (Next 2-3 days)</option>
                <option value="Flexible / Gathering Quotes">Flexible / Gathering Quotes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Contact Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Homeowner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Phone (Optional)
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center space-x-2 transition shadow-lg shadow-blue-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Discovery &amp; RFQ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
