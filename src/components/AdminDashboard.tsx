import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ShieldCheck, RotateCcw, Server, Database, Bot, Users, CheckCircle2 } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, hRes] = await Promise.all([
        api.admin.stats(),
        api.admin.users(),
        api.health(),
      ]);
      setStats(sRes.data);
      setUsers(uRes.data);
      setHealth(hRes);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetSeed = async () => {
    if (!confirm('Are you sure you want to reset the demonstration database? This will restore the 34 Tamil Nadu advocates and demo matters.')) {
      return;
    }
    setResetting(true);
    setResetMsg('');
    try {
      const res = await api.admin.seedReset();
      setResetMsg(res.message);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">System Administration</h1>
          <p className="text-xs text-slate-600">Platform operational health, AI provider configuration, and demo data management.</p>
        </div>

        <button
          onClick={handleResetSeed}
          disabled={resetting}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-2 self-start disabled:opacity-50"
        >
          <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
          <span>{resetting ? 'Re-seeding...' : 'Reset Demo Seed (34 Advocates)'}</span>
        </button>
      </div>

      {resetMsg && (
        <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{resetMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Citizens</span>
          <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {stats?.citizensCount ?? '-'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Advocates</span>
          <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {stats?.advocatesCount ?? '-'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Case Files</span>
          <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {stats?.casesCount ?? '-'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Documents</span>
          <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {stats?.documentsCount ?? '-'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indexed Chunks</span>
          <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {stats?.indexedChunksCount ?? '-'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Consultations</span>
          <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {stats?.consultationsCount ?? '-'}
          </div>
        </div>
      </div>

      {/* System Architecture & Health Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Database Layer & Resilience</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Storage Engine:</span>
              <span className="font-semibold text-slate-900">{health?.database?.engine || 'JSON Persistent Store'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Connection State:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold font-mono">
                {health?.database?.status || 'CONNECTED'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Seeded Advocates:</span>
              <span className="font-mono text-slate-900 font-bold">{health?.database?.advocatesSeeded || 34}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Bot size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">AI Services & Grounding Status</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Provider Status:</span>
              <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                health?.aiProvider?.configured ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {health?.aiProvider?.status || 'ACTIVE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Primary Model:</span>
              <span className="font-semibold text-slate-900">{health?.aiProvider?.primaryModel || 'gemini-3.8-flash'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">RAG Strategy:</span>
              <span className="font-semibold text-slate-900">Vector Cosine + Hybrid TF-IDF Keyword Scoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users size={16} className="text-slate-600" />
          <h2 className="text-sm font-bold text-slate-950 font-['Outfit']">Registered Users & Advocates</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Full Legal Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900">{u.fullName}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : u.role === 'advocate'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="py-2 px-3 text-slate-500">{u.city || '-'}, {u.district || '-'}</td>
                  <td className="py-2 px-3">
                    <span className="text-emerald-700 font-semibold">{u.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
