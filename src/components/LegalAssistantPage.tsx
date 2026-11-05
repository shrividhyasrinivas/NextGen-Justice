import React, { useState, useEffect } from 'react';
import { User, CaseRecord, DocumentRecord, AssistantAnswer, GroundedSource } from '../types';
import { api } from '../lib/api';
import { Bot, Send, FileText, Scale, ChevronDown, ChevronUp, Copy, Check, Info, ShieldCheck } from 'lucide-react';
import { Language } from '../i18n/translations';

interface Props {
  user: User | null;
  currentLanguage: Language;
  initialCaseId?: string | null;
  initialDocId?: string | null;
}

export function LegalAssistantPage({ user, currentLanguage, initialCaseId, initialDocId }: Props) {
  const [mode, setMode] = useState<'general' | 'case'>('general');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || '');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Suggested queries
  const GENERAL_SUGGESTIONS = [
    'What is the difference between a civil case and a criminal case?',
    'What is an FIR and how is it lodged under CrPC / BNSS?',
    'Who is entitled to free legal aid under the Legal Services Authorities Act?',
    'What is the difference between an advocate and a judge?',
    'What is the purpose and time limit of a court summons?',
    'What information should I collect before consulting an advocate?',
  ];

  const CASE_SUGGESTIONS = [
    'What deadline is mentioned in this legal notice for vacating the premises?',
    'Who are the parties named in this document and what are their roles?',
    'What is the total amount of rental arrears or monetary claim demanded?',
    'What statutory sections or acts are cited in this notice?',
    'What evidence is mentioned in my uploaded document?',
  ];

  useEffect(() => {
    async function loadCasesAndDocs() {
      if (!user) return;
      try {
        const cRes = await api.cases.list();
        setCases(cRes.data || []);
        if (!selectedCaseId && cRes.data && cRes.data.length > 0) {
          setSelectedCaseId(cRes.data[0]._id);
        }
      } catch (err) {
        console.error('Error loading cases for assistant:', err);
      }
    }
    loadCasesAndDocs();
  }, [user]);

  useEffect(() => {
    async function loadDocs() {
      if (selectedCaseId) {
        try {
          const res = await api.documents.listForCase(selectedCaseId);
          setDocuments(res.data || []);
          if (!selectedDocId && res.data && res.data.length > 0) {
            setSelectedDocId(res.data[0]._id);
          }
        } catch (err) {
          console.error('Error loading documents for assistant:', err);
        }
      }
    }
    loadDocs();
  }, [selectedCaseId]);

  const handleSubmit = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = customQ || question;
    if (!query.trim()) return;

    setError('');
    setLoading(true);
    setAnswer(null);

    try {
      if (mode === 'general') {
        const res = await api.assistant.askGeneral(query.trim(), currentLanguage);
        setAnswer(res.data);
      } else {
        if (!user) {
          setError('Sign in with a citizen account to ask questions about your private case documents.');
          return;
        }
        if (!selectedCaseId) {
          setError('Please select one of your active cases to query its documents.');
          return;
        }
        const res = await api.assistant.askCase(query.trim(), {
          caseId: selectedCaseId,
          documentId: selectedDocId || undefined,
          language: currentLanguage,
        });
        setAnswer(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Assistant request failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceExpand = (id: string) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = () => {
    if (answer?.answer) {
      navigator.clipboard.writeText(answer.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Bot size={15} className="text-amber-600" />
          <span>Grounded Intelligence</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">Legal AI Assistant</h1>
        <p className="text-xs text-slate-600">
          Grounded query engine with dual modes: General Indian statutory knowledge and private case document RAG.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setMode('general');
            setAnswer(null);
          }}
          className={`p-4 rounded-lg border text-left transition-all ${
            mode === 'general'
              ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
              : 'bg-slate-50 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-950 mb-1">
            <Scale size={15} />
            <span>Mode A: General Indian Legal Knowledge</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Explains Indian statutes, court terminology, CPC/CrPC procedures, and constitutional legal aid provisions.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('case');
            setAnswer(null);
          }}
          className={`p-4 rounded-lg border text-left transition-all ${
            mode === 'case'
              ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
              : 'bg-slate-50 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-950 mb-1">
            <FileText size={15} />
            <span>Mode B: Private Case & Document Assistant</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Strictly answers from your uploaded case documents with exact page and chunk citations. Cross-account isolated.
          </p>
        </button>
      </div>

      {/* Case & Document Selector for Mode B */}
      {mode === 'case' && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Case & Document Scope
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Active Case Dossier</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.caseId} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Target Document (Optional)</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none"
              >
                <option value="">All Documents in this Case ({documents.length})</option>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.documentName} ({d.chunkCount || 0} chunks)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Queries */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Suggested Questions for Verification:
        </span>
        <div className="flex flex-wrap gap-2">
          {(mode === 'general' ? GENERAL_SUGGESTIONS : CASE_SUGGESTIONS).map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuestion(sq);
                handleSubmit(undefined, sq);
              }}
              className="text-xs text-left px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 rounded transition-colors"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            mode === 'general'
              ? 'Ask an Indian legal procedural question (e.g. difference between civil and criminal case, summons time limits, legal aid)...'
              : 'Ask a question grounded in your uploaded case documents (e.g. what deadline is mentioned, who are the parties)...'
          }
          className="w-full p-4 pr-24 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white shadow-2xs resize-none"
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <span>Analyzing...</span>
            ) : (
              <>
                <span>Submit</span>
                <Send size={13} />
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
          {error}
        </div>
      )}

      {/* Assistant Response Card */}
      {answer && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-900">
                {answer.mode === 'general' ? 'Indian Legal Information' : 'Case Document Findings'}
              </span>
              <span className="text-slate-300">·</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                answer.provider === 'gemini-3.8-flash'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {answer.provider === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Deterministic RAG'}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Answer Text */}
          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {answer.answer}
          </div>

          {/* Mode A Statutory Citations */}
          {answer.statutoryReferences && answer.statutoryReferences.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Statutory Citations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {answer.statutoryReferences.map((ref, i) => (
                  <span key={i} className="text-[11px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded font-mono">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mode B Grounded Source Citations */}
          {answer.sources && answer.sources.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                <span>Verified Source Citations ({answer.sources.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Grounded Document Passages</span>
              </div>

              <div className="space-y-2">
                {answer.sources.map((src, i) => {
                  const isExpanded = expandedSources[src.sourceId];
                  return (
                    <div key={src.sourceId} className="border border-slate-200 rounded p-3 text-xs bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">[{i + 1}]</span>
                          <span className="font-semibold text-slate-900">{src.title}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">Page {src.pageNumber}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-[10px] text-slate-400">Chunk #{src.chunkIndex}</span>
                        </div>
                        <button
                          onClick={() => toggleSourceExpand(src.sourceId)}
                          className="text-slate-500 hover:text-slate-900 flex items-center gap-0.5 text-[11px] font-semibold"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Inspect Excerpt'}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700 italic bg-white p-2.5 rounded border border-slate-100">
                          "{src.excerpt}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Institutional Advisory */}
          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 border-t border-slate-100">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>Answers do not constitute formal attorney legal advice. Consult an enpaneled advocate for legal representation.</span>
          </div>
        </div>
      )}
    </div>
  );
}
