import { Scale, FileText, Users, Bot, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface Props {
  currentLanguage: Language;
  onGetStarted: () => void;
  onExploreAdvocates: () => void;
  onOpenAssistant: () => void;
}

export function LandingPage({ currentLanguage, onGetStarted, onExploreAdvocates, onOpenAssistant }: Props) {
  const t = (key: string) => translations[currentLanguage][key] || key;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Institutional Hero Section */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded">
                <Scale size={14} className="text-amber-600" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight font-['Outfit'] text-balance">
                {t('hero.title')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {t('hero.description')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 rounded-md shadow-sm transition-colors flex items-center gap-2"
                >
                  <span>{t('hero.cta.start')}</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={onExploreAdvocates}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
                >
                  {t('hero.cta.explore')}
                </button>
              </div>

              {/* Institutional Metric Strip */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">34+</div>
                  <div className="text-xs text-slate-500 font-medium">{t('hero.stat.advocates')}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">38</div>
                  <div className="text-xs text-slate-500 font-medium">{t('hero.stat.districts')}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-950 font-['JetBrains_Mono'] tabular-nums">100%</div>
                  <div className="text-xs text-slate-500 font-medium">{t('hero.stat.grounding')}</div>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Chamber Photography */}
            <div className="lg:col-span-5">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-xl bg-slate-100 aspect-16/10">
                <img
                  src="/src/assets/images/hero_legal_portal_1793097557736.jpg"
                  alt="Distinguished Indian Legal Chamber and Research Library"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Judicial Research & Public Legal Aid
                    </p>
                    <p className="text-sm font-medium text-slate-100">
                      Serving Madurai, Chennai, Coimbatore, and districts across Tamil Nadu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Mechanism */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Architecture & Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-['Outfit']">
            {t('workflow.title')}
          </h2>
          <p className="text-sm text-slate-600">
            A demonstrable end-to-end legal intelligence platform built with modular Document AI, MongoDB persistence, and verified statutory retrieval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="p-5 bg-white border border-slate-200 rounded-md shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs font-['JetBrains_Mono']">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('workflow.step1.title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('workflow.step1.desc')}</p>
          </div>

          {/* Step 2 */}
          <div className="p-5 bg-white border border-slate-200 rounded-md shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs font-['JetBrains_Mono']">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('workflow.step2.title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('workflow.step2.desc')}</p>
          </div>

          {/* Step 3 */}
          <div className="p-5 bg-white border border-slate-200 rounded-md shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs font-['JetBrains_Mono']">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('workflow.step3.title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('workflow.step3.desc')}</p>
          </div>

          {/* Step 4 */}
          <div className="p-5 bg-white border border-slate-200 rounded-md shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs font-['JetBrains_Mono']">
              04
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('workflow.step4.title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('workflow.step4.desc')}</p>
          </div>

          {/* Step 5 */}
          <div className="p-5 bg-white border border-slate-200 rounded-md shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs font-['JetBrains_Mono']">
              05
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('workflow.step5.title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('workflow.step5.desc')}</p>
          </div>
        </div>
      </section>

      {/* Feature Pillar Spotlight */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-slate-200 rounded-lg space-y-3">
              <div className="w-10 h-10 rounded bg-slate-100 text-slate-900 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950">Document AI & Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Native parsing for PDF, DOCX, and TXT files. Automated pipeline segments pages, indexes text into vector chunks, and extracts counterparty names, claims, and statutory deadlines for user approval.
              </p>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg space-y-3">
              <div className="w-10 h-10 rounded bg-slate-100 text-slate-900 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950">Location-Aware Advocate Matching</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Over 34 demonstration advocates seeded across Madurai, Chennai, Coimbatore, Salem, Tirunelveli, and Virudhunagar with transparent scoring and full consultation request booking.
              </p>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg space-y-3">
              <div className="w-10 h-10 rounded bg-slate-100 text-slate-900 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950">Grounded Legal AI Assistant</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Two explicit modes: Mode A answers general Indian legal queries using Gemini or verified knowledge, while Mode B performs private RAG against citizen documents with exact page citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Limitations & Disclaimer Notice */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-slate-100 border border-slate-200 rounded-lg flex items-start gap-4">
          <ShieldAlert size={24} className="text-slate-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">{t('disclaimer.title')}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{t('disclaimer.text')}</p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-600" /> Account-scoped private document access</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-600" /> No Aadhaar or confidential biometric storage</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-600" /> Fictional demonstration bar enrollments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base font-['Outfit']">
              <Scale size={18} className="text-amber-400" />
              <span>NextGen Justice V8</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enterprise legal aid, case intelligence, and document AI platform for academic and demonstration purposes.
            </p>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Legal Frameworks</h5>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>Legal Services Authorities Act, 1987</li>
              <li>Civil Procedure Code, 1908</li>
              <li>Transfer of Property Act, 1882</li>
              <li>Negotiable Instruments Act, 1881</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Judicial Coverage</h5>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>Madurai Bench of Madras High Court</li>
              <li>High Court of Judicature at Madras</li>
              <li>District & Sessions Courts, Tamil Nadu</li>
              <li>Consumer Disputes Redressal Commissions</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Access & Compliance</h5>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Compliant with WCAG AA accessibility standards, responsive desktop and mobile viewports, and secure JWT authentication.
            </p>
            <div className="text-[11px] text-slate-400">
              © 2026 NextGen Justice. All demonstration records fictional.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
