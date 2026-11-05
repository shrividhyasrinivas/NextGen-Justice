import { useState, useEffect } from 'react';
import { User, ConsultationRequest, CaseRecord } from '../types';
import { api } from '../lib/api';
import { Check, X, Calendar, MessageSquare, MapPin } from 'lucide-react';

interface Props {
  user: User;
  onNavigateToCase: (caseId: string) => void;
}

export function AdvocateDashboard({ user, onNavigateToCase }: Props) {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, casesRes] = await Promise.all([
        api.consultations.list(),
        api.cases.list(),
      ]);
      setRequests(reqRes.data || []);
      setCases(casesRes.data || []);
    } catch (err) {
      console.error('Advocate dashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      const note = responseNotes[id] || (status === 'ACCEPTED' ? 'Consultation approved. Please bring case documents.' : 'Advocate unavailable for this matter.');
      await api.consultations.updateStatus(id, status, note);
      await loadData();
    } catch (err) {
      console.error('Failed to update consultation status:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const pastRequests = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Advocate Chambers Portal</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-700">
              <MapPin size={12} className="text-amber-600" />
              {user.district || 'Tamil Nadu'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">
            Chambers of {user.fullName}
          </h1>
          <p className="text-xs text-slate-600">
            Incoming citizen consultation requests, client case files, and court hearings.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Inquiries</span>
          <div className="text-3xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">Require chamber response</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accepted Consultations</span>
          <div className="text-3xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {requests.filter((r) => r.status === 'ACCEPTED').length}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">Scheduled or active</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Cases</span>
          <div className="text-3xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {cases.length}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">Active client dossiers</span>
        </div>
      </div>

      {/* Pending Consultation Requests */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={17} className="text-slate-700" />
            <h2 className="text-base font-bold text-slate-950 font-['Outfit']">
              Incoming Consultation Requests ({pendingRequests.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending citizen consultation requests at this time.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div key={req._id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-950">{req.citizenName || 'Citizen User'}</h3>
                    <span className="text-[11px] text-slate-500">{req.citizenEmail} · {req.citizenPhone || 'Phone unprovided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 uppercase">
                      Mode: {req.mode}
                    </span>
                    {req.preferredDate && (
                      <span className="flex items-center gap-1 font-mono text-slate-700 text-[11px]">
                        <Calendar size={12} /> {req.preferredDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-800">
                  <span className="font-semibold block mb-0.5 text-slate-600 text-[11px]">Matter Description & Inquiry:</span>
                  <p className="bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                    "{req.message}"
                  </p>
                </div>

                {req.caseTitle && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Attached Case:</span>
                    <button
                      onClick={() => req.caseId && onNavigateToCase(req.caseId)}
                      className="font-semibold text-slate-900 underline"
                    >
                      {req.caseTitle}
                    </button>
                  </div>
                )}

                {/* Response Note input */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={responseNotes[req._id] || ''}
                    onChange={(e) => setResponseNotes({ ...responseNotes, [req._id]: e.target.value })}
                    placeholder="Chamber response note (e.g. Bring original lease deed and postal slip)..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus(req._id, 'REJECTED')}
                      disabled={processingId === req._id}
                      className="px-3 py-1.5 text-xs font-bold uppercase text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                    >
                      <X size={13} />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req._id, 'ACCEPTED')}
                      disabled={processingId === req._id}
                      className="px-4 py-1.5 text-xs font-bold uppercase text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
                    >
                      <Check size={13} />
                      <span>Accept Consultation</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Resolved Consultations */}
      {pastRequests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-950 font-['Outfit']">Past Consultations ({pastRequests.length})</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {pastRequests.map((r) => (
              <div key={r._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{r.citizenName}</span>
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-500">{r.caseTitle || r.message.substring(0, 40) + '...'}</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                  r.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
