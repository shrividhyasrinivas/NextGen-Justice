import React, { useState, useEffect } from 'react';
import { Advocate, CaseRecord, User } from '../types';
import { api } from '../lib/api';
import { X, Scale, CheckCircle2, User as UserIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  advocate: Advocate | null;
  user: User | null;
  onOpenAuth: () => void;
}

export function ConsultationModal({ isOpen, onClose, advocate, user, onOpenAuth }: Props) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [mode, setMode] = useState('IN_PERSON');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      api.cases.list().then((res) => {
        setCases(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedCaseId(res.data[0]._id);
        }
      }).catch(() => {});
    }
  }, [user]);

  if (!isOpen || !advocate) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-lg p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-800">
            <UserIcon size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Sign In Required</h3>
          <p className="text-xs text-slate-600">
            Please sign in or register as a citizen to book a formal consultation with {advocate.fullName}.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a brief description of your legal inquiry.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await api.consultations.request({
        advocateId: advocate._id,
        caseId: selectedCaseId || undefined,
        message: message.trim(),
        mode,
        preferredDate: preferredDate || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Consultation submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight uppercase">Request Legal Consultation</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Consultation Request Dispatched</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Your consultation request has been forwarded to the chambers of {advocate.fullName}. You will receive a notification when accepted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                {error}
              </div>
            )}

            {/* Advocate Preview Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{advocate.fullName}</span>
                <span className="font-semibold text-slate-700">{advocate.feeRange}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {advocate.city}, {advocate.district} · {advocate.yearsOfExperience} yrs experience
              </div>
              <div className="text-[11px] text-slate-600 italic">
                {advocate.practiceAreas.join(' · ')}
              </div>
            </div>

            {/* Select Associated Case */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associate with Case File (Optional)</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none"
              >
                <option value="">General Pre-Litigation Advisory (No Case)</option>
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.caseId} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                >
                  <option value="IN_PERSON">In-Person Chambers</option>
                  <option value="VIDEO">Video Conference</option>
                  <option value="PHONE">Telephonic Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Matter Summary & Inquiry Details</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="State the core legal questions, any urgent hearing dates, or documents you intend to present..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded transition-colors"
              >
                {submitting ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
