import React, { useState, useEffect, useRef } from 'react';
import { User, CaseRecord, DocumentRecord } from '../types';
import { api } from '../lib/api';
import { Upload, FileText, CheckCircle2, Download, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  user: User;
  initialCaseId?: string | null;
  onNavigateToAssistant: (caseId: string, docId?: string) => void;
}

export function DocumentsPage({ user, initialCaseId, onNavigateToAssistant }: Props) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || '');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [approvingFacts, setApprovingFacts] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cases
  useEffect(() => {
    async function loadCases() {
      try {
        const res = await api.cases.list();
        setCases(res.data || []);
        if (!selectedCaseId && res.data && res.data.length > 0) {
          setSelectedCaseId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
      }
    }
    loadCases();
  }, []);

  // Load documents for selected case
  const loadDocuments = async () => {
    try {
      if (selectedCaseId) {
        const res = await api.documents.listForCase(selectedCaseId);
        setDocuments(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedDoc(res.data[0]);
        } else {
          setSelectedDoc(null);
        }
      } else {
        const res = await api.documents.list();
        setDocuments(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedDoc(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedCaseId]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15 MB limit.');
      return;
    }

    setErrorMsg('');
    setApprovalSuccess('');
    setUploading(true);
    setUploadProgress(10);
    setUploadStatusMsg('Authenticating and preparing case dossier...');

    try {
      let caseIdToUse = selectedCaseId;

      // Auto-create case if citizen has no cases yet
      if (!caseIdToUse) {
        setUploadStatusMsg('Creating case dossier for uploaded document...');
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        const newCaseRes = await api.cases.create({
          title: `Case: ${cleanName}`,
          category: 'Civil',
          description: `Case dossier created from uploaded document: ${file.name}`,
          district: user?.district || 'Madurai',
          city: user?.city || 'Madurai',
          state: user?.state || 'Tamil Nadu',
        });
        caseIdToUse = newCaseRes.data._id;
        setCases((prev) => [newCaseRes.data, ...prev]);
        setSelectedCaseId(caseIdToUse);
      }

      setUploadProgress(40);
      setUploadStatusMsg('Running Document AI text extraction & chunking...');
      const res = await api.documents.upload(caseIdToUse, file, (percent) => {
        setUploadProgress(Math.min(95, Math.max(15, percent)));
      });

      setUploadProgress(100);
      setUploadStatusMsg('Document analyzed and indexed successfully.');
      await loadDocuments();
      if (res.data) {
        setSelectedDoc(res.data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to upload document. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatusMsg('');
      }, 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApproveFacts = async (docId: string) => {
    setApprovingFacts(true);
    setApprovalSuccess('');
    try {
      const res = await api.documents.approveFacts(docId);
      setApprovalSuccess('Extracted legal facts verified and merged into Case Dossier.');
      await loadDocuments();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Fact approval failed.');
    } finally {
      setApprovingFacts(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document and its indexed retrieval chunks?')) return;
    try {
      await api.documents.delete(docId);
      await loadDocuments();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete document.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Case Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">Document Center & AI Extraction</h1>
          <p className="text-xs text-slate-600">
            Upload legal agreements, statutory notices, or summons. Automated pipeline extracts parties, dates, claims, and indexes chunks for RAG.
          </p>
        </div>

        {/* Case selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Active Case:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-slate-900 focus:outline-none max-w-xs"
          >
            {cases.map((c) => (
              <option key={c._id} value={c._id}>
                {c.caseId} — {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
          {errorMsg}
        </div>
      )}

      {approvalSuccess && (
        <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{approvalSuccess}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors bg-white ${
          uploading ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
            <Upload size={22} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-950">
              {uploading ? 'Processing Document...' : 'Upload Legal Matter Document'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports <strong className="text-slate-700">PDF, DOCX, TXT, PNG, JPG</strong> up to 15 MB
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span>{uploadStatusMsg}</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Left Column Document list, Right Column Extracted Facts & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Attached Documents ({documents.length})
            </h3>
            <span className="text-[11px] text-slate-400">Secured Storage</span>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No files uploaded for this case yet. Upload above to run extraction.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const isSelected = selectedDoc?._id === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`py-3 px-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-50 border-l-2 border-slate-900' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className={isSelected ? 'text-slate-900' : 'text-slate-400'} />
                        <span className="text-xs font-bold text-slate-950 truncate block max-w-[200px]">
                          {doc.documentName}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        doc.status === 'indexed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'awaiting_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 pl-6">
                      <span>{(doc.size / 1024).toFixed(1)} KB · {doc.chunkCount || 0} chunks</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={api.documents.getDownloadUrl(doc._id)}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-slate-900"
                          title="Download"
                        >
                          <Download size={13} />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc._id);
                          }}
                          className="text-slate-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Extracted Facts Review Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-2xs">
          {selectedDoc ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Document AI Analysis
                  </span>
                  <h3 className="text-sm font-bold text-slate-950">{selectedDoc.documentName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToAssistant(selectedDoc.caseId, selectedDoc._id)}
                    className="px-3 py-1.5 text-xs font-bold uppercase text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5"
                  >
                    <span>Ask AI</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Status lifecycle badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Pipeline State:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {selectedDoc.status.toUpperCase()}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Pages: {selectedDoc.pageCount || 1}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Indexed Chunks: {selectedDoc.chunkCount || 0}</span>
              </div>

              {/* Extracted Facts Cards */}
              {selectedDoc.extractedFacts ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Extracted Legal Intelligence
                      </span>
                      {selectedDoc.factsReviewed && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Merged into Case Dossier
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Document Type:</span>
                        <span className="font-semibold text-slate-900">{selectedDoc.extractedFacts.documentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Forum / Authority:</span>
                        <span className="font-semibold text-slate-900">{selectedDoc.extractedFacts.courtOrAuthority}</span>
                      </div>
                    </div>

                    {/* Parties */}
                    {selectedDoc.extractedFacts.parties && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 block text-[11px] mb-1">Identified Litigant Parties:</span>
                        <div className="space-y-1">
                          {selectedDoc.extractedFacts.parties.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-slate-200">
                              <span className="font-semibold text-slate-900">{p.name}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{p.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Dates */}
                    {selectedDoc.extractedFacts.dates && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 block text-[11px] mb-1">Extracted Dates & Deadlines:</span>
                        <div className="space-y-1">
                          {selectedDoc.extractedFacts.dates.map((d, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-slate-200">
                              <span className="text-slate-600">{d.label}</span>
                              <span className="font-mono font-bold text-slate-900">{d.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Demands / Monetary Claims */}
                    {selectedDoc.extractedFacts.claimsOrDemands && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 block text-[11px] mb-1">Demands & Monetary Claims:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                          {selectedDoc.extractedFacts.claimsOrDemands.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Referenced Sections */}
                    {selectedDoc.extractedFacts.referencedSections && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 block text-[11px] mb-1">Statutory Provisions:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDoc.extractedFacts.referencedSections.map((sec, i) => (
                            <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono text-slate-800">
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fact Approval CTA Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      Verify these facts before applying to the legal dossier.
                    </span>
                    <button
                      onClick={() => handleApproveFacts(selectedDoc._id)}
                      disabled={approvingFacts || selectedDoc.factsReviewed}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>{selectedDoc.factsReviewed ? 'Facts Merged' : approvingFacts ? 'Approving...' : 'Approve & Apply to Case'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  {selectedDoc.status === 'extracting'
                    ? 'Extraction in progress... Refreshing.'
                    : 'No structured facts extracted for this file.'}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center space-y-2">
              <FileText size={32} className="mx-auto text-slate-300" />
              <h4 className="text-xs font-bold text-slate-700">Select a document to review extracted legal facts</h4>
              <p className="text-[11px] text-slate-400">Upload a PDF, DOCX, or TXT file to begin extraction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
