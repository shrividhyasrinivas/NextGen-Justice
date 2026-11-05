import React, { useState, useEffect } from 'react';
import { CaseRecord, User } from '../types';
import { api } from '../lib/api';
import { Plus, Search, Folder, Calendar, Users as UsersIcon, Scale, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { TAMIL_NADU_DISTRICTS } from '../data/locations';

interface Props {
  user: User;
  selectedCaseId?: string | null;
  onClearSelectedCase: () => void;
  onNavigateToDocuments: (caseId: string) => void;
  onNavigateToAssistant: (caseId: string) => void;
}

export function CasesPage({ user, selectedCaseId, onClearSelectedCase, onNavigateToDocuments, onNavigateToAssistant }: Props) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Case form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Property');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState(user.district || 'Madurai');
  const [city, setCity] = useState(user.city || 'Madurai');
  const [urgency, setUrgency] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const currentDistrictData = TAMIL_NADU_DISTRICTS.find((d) => d.district === district) || TAMIL_NADU_DISTRICTS[0];

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    const data = TAMIL_NADU_DISTRICTS.find((item) => item.district === d);
    if (data && data.cities.length) {
      setCity(data.cities[0]);
    }
  };

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await api.cases.list();
      setCases(res.data || []);
      if (selectedCaseId) {
        const target = res.data.find((c) => c._id === selectedCaseId);
        if (target) {
          const detail = await api.cases.get(target._id);
          setActiveCase(detail.data);
        }
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [selectedCaseId]);

  const handleSelectCase = async (c: CaseRecord) => {
    try {
      const detail = await api.cases.get(c._id);
      setActiveCase(detail.data);
    } catch {
      setActiveCase(c);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await api.cases.create({
        title,
        category,
        description,
        state: 'Tamil Nadu',
        district,
        city,
        urgency,
      });

      setIsNewModalOpen(false);
      setTitle('');
      setDescription('');
      await loadCases();
      setActiveCase(res.data);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create case.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (search) {
      const s = search.toLowerCase();
      if (!c.title.toLowerCase().includes(s) && !c.caseId.toLowerCase().includes(s) && !c.description.toLowerCase().includes(s)) {
        return false;
      }
    }
    if (filterCategory && c.category !== filterCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* If Viewing a Specific Case Dossier */}
      {activeCase ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveCase(null);
                onClearSelectedCase();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Case Directory</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToDocuments(activeCase._id)}
                className="px-3.5 py-1.5 text-xs font-bold uppercase text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Upload Document</span>
              </button>
              <button
                onClick={() => onNavigateToAssistant(activeCase._id)}
                className="px-3.5 py-1.5 text-xs font-bold uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Scale size={14} />
                <span>Ask Case AI</span>
              </button>
            </div>
          </div>

          {/* Dossier Header */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                  {activeCase.caseId}
                </span>
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {activeCase.category} Law
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-medium text-slate-600">
                  {activeCase.city}, {activeCase.district}, {activeCase.state}
                </span>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                {activeCase.status}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">{activeCase.title}</h1>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">{activeCase.description}</p>
          </div>

          {/* Dossier Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parties Identified */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <UsersIcon size={16} className="text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Litigant Parties & Entities</h3>
              </div>
              {activeCase.parties && activeCase.parties.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activeCase.parties.map((p, i) => (
                    <div key={i} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="text-slate-500 uppercase text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No parties extracted yet. Upload a document to extract counterparty names.</p>
              )}
            </div>

            {/* Statutory Sections & Forum */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Scale size={16} className="text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Judicial Forum & Sections</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Competent Court / Authority:</span>
                  <span className="font-semibold text-slate-900">{activeCase.courtOrAuthority || 'District Court Madurai'}</span>
                </div>
                {activeCase.referencedSections && (
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">Referenced Sections:</span>
                    <div className="space-y-1">
                      {activeCase.referencedSections.map((sec, i) => (
                        <div key={i} className="text-[11px] text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">
                          {sec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Relevant Dates */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Calendar size={16} className="text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Key Dates & Deadlines</h3>
              </div>
              {activeCase.relevantDates && activeCase.relevantDates.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {activeCase.relevantDates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-600">{d.label}</span>
                      <span className="font-bold text-slate-900 font-['JetBrains_Mono']">{d.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Upload a legal notice or agreement to extract relevant dates.</p>
              )}
            </div>

            {/* Extracted Facts & Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Extracted Fact Intelligence</h3>
              </div>
              {activeCase.extractedFactsSummary ? (
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {activeCase.extractedFactsSummary}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  No approved facts yet. Upload a document in Document Center to run extraction and review.
                </p>
              )}
            </div>
          </div>

          {/* Attached Documents in this Case */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-950 font-['Outfit']">Attached Case Documents ({activeCase.documentDetails?.length || 0})</h3>
            {activeCase.documentDetails && activeCase.documentDetails.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {activeCase.documentDetails.map((doc) => (
                  <div key={doc._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900 block">{doc.documentName}</span>
                        <span className="text-[11px] text-slate-400">{(doc.size / 1024).toFixed(1)} KB · {doc.status}</span>
                      </div>
                    </div>
                    <a
                      href={api.documents.getDownloadUrl(doc._id)}
                      download
                      className="text-xs font-semibold text-slate-800 hover:text-slate-950"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">
                No files uploaded to this case yet. Click "Upload Document" to attach notices, deeds, or pleadings.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Case Directory List View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">Case Dossiers</h1>
              <p className="text-xs text-slate-600">Review and organize your active legal proceedings and matter dossiers.</p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 self-start"
            >
              <Plus size={15} />
              <span>Open New Case</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, Case ID, or keywords..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Property">Property & Tenancy</option>
              <option value="Civil">Civil Dispute</option>
              <option value="Family">Family & Matrimonial</option>
              <option value="Consumer">Consumer Protection</option>
              <option value="Commercial">Commercial Contract</option>
            </select>
          </div>

          {/* Cases Grid / Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <Folder size={32} className="mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900">No Case Files Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active case records matched your filter criteria. Open a new case to begin managing your legal proceeding.
              </p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-4 py-2 text-xs font-bold uppercase text-white bg-slate-900 rounded-md"
              >
                Create New Case
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleSelectCase(c)}
                  className="bg-white border border-slate-200 hover:border-slate-400 rounded-lg p-5 cursor-pointer transition-all shadow-2xs space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {c.caseId}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {c.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-950 group-hover:text-slate-800 transition-colors line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{c.city}, {c.district}</span>
                    <span className="font-semibold text-slate-900 group-hover:underline">View Dossier →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Case Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold tracking-tight uppercase">Open New Case File</h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Case Matter Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Commercial Tenancy Termination & Recovery of Arrears"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    <option value="Property">Property & Real Estate</option>
                    <option value="Civil">Civil Dispute</option>
                    <option value="Family">Family & Matrimonial</option>
                    <option value="Consumer">Consumer Grievance</option>
                    <option value="Commercial">Commercial & Business</option>
                    <option value="Labour">Labour & Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High (Hearing scheduled)</option>
                    <option value="URGENT">Urgent (Statutory deadline)</option>
                  </select>
                </div>
              </div>

              {/* Dependent Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jurisdiction District</label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    {currentDistrictData.cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary of Facts & Relief Sought</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the nature of the dispute, counterparty, property or transaction involved, and remedies sought..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating Case...' : 'Open Case File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
