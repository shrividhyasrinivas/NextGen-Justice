import { useState, useEffect } from 'react';
import { User, CaseRecord, DocumentRecord, Advocate, ConsultationRequest } from '../types';
import { api } from '../lib/api';
import { FileText, Users, Bot, Plus, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface Props {
  user: User;
  currentLanguage: Language;
  onNavigate: (tab: string, caseId?: string) => void;
  onOpenConsultationModal: (advocate: Advocate) => void;
}

export function CitizenDashboard({ user, currentLanguage, onNavigate, onOpenConsultationModal }: Props) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [recommendedAdvocates, setRecommendedAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);

  const t = (key: string) => translations[currentLanguage][key] || key;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cRes, dRes, conRes, advRes] = await Promise.all([
          api.cases.list(),
          api.documents.list(),
          api.consultations.list(),
          api.advocates.list({
            state: user.state || 'Tamil Nadu',
            district: user.district || 'Madurai',
            broadenSearch: false,
          }),
        ]);

        setCases(cRes.data || []);
        setDocuments(dRes.data || []);
        setConsultations(conRes.data || []);
        setRecommendedAdvocates((advRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.district, user.state]);

  const activeCasesCount = cases.filter((c) => c.status !== 'CLOSED').length;
  const pendingRequestsCount = consultations.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner with Citizen Location info */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Citizen Legal Portal</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-700">
              <MapPin size={12} className="text-amber-600" />
              {user.district || 'Madurai'}, {user.state || 'Tamil Nadu'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">
            {t('dashboard.welcome')}, {user.fullName}
          </h1>
          <p className="text-xs text-slate-600">
            Matter tracking, document extraction, and advocate consultations for your legal proceedings.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('cases')}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Open Case</span>
          </button>
          <button
            onClick={() => onNavigate('documents')}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Bot size={14} />
            <span>Legal AI</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Legal Matters</span>
          <div className="text-3xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {loading ? '-' : activeCasesCount}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            {cases.length} total registered case files
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analyzed Documents</span>
          <div className="text-3xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {loading ? '-' : documents.length}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Indexed into vector retrieval chunks
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultation Requests</span>
          <div className="text-3xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">
            {loading ? '-' : pendingRequestsCount}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            {consultations.length} total advocate consultation records
          </span>
        </div>
      </div>

      {/* Two Column Section: Cases & Recommended Advocates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Cases list */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-slate-700" />
              <h2 className="text-base font-bold text-slate-950 font-['Outfit']">
                {t('dashboard.cases.title')}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('cases')}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading case records...</div>
          ) : cases.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-slate-500">You do not have any active case dossiers yet.</p>
              <button
                onClick={() => onNavigate('cases')}
                className="px-4 py-2 text-xs font-bold uppercase text-white bg-slate-900 rounded-md"
              >
                Open Your First Case
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cases.slice(0, 4).map((c) => (
                <div key={c._id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{c.caseId}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-600">{c.category}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{c.city}, {c.district}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-950 truncate">{c.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                      c.status === 'PROCEEDING'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : c.status === 'CLOSED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.status}
                    </span>
                    <button
                      onClick={() => onNavigate('cases', c._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded transition-colors"
                    >
                      Dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): District Advocate Recommendations */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users size={17} className="text-slate-700" />
              <h2 className="text-base font-bold text-slate-950 font-['Outfit']">
                {user.district || 'Madurai'} Advocates
              </h2>
            </div>
            <button
              onClick={() => onNavigate('advocates')}
              className="text-xs font-bold text-slate-700 hover:text-slate-950"
            >
              Directory
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Personalized recommendations based on your registered location ({user.district || 'Madurai'}).
          </p>

          <div className="space-y-3">
            {recommendedAdvocates.map((adv) => (
              <div key={adv._id} className="p-3.5 border border-slate-200 rounded-md space-y-2 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-950">{adv.fullName}</h4>
                    <span className="text-[11px] text-slate-500">{adv.city}, {adv.district}</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    ★ {adv.rating}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 line-clamp-1">
                  {adv.practiceAreas.join(' · ')}
                </div>

                {adv.matchExplanation && (
                  <div className="text-[10px] text-slate-500 bg-white p-1.5 rounded border border-slate-100">
                    {adv.matchExplanation.summary}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{adv.yearsOfExperience} yrs exp.</span>
                  <button
                    onClick={() => onOpenConsultationModal(adv)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors"
                  >
                    Consult
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
