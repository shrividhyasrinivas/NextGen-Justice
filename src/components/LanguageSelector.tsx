import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../i18n/translations';

interface Props {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors whitespace-nowrap"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select language"
      >
        <Globe size={14} className="text-slate-500 shrink-0" />
        <span className="font-semibold">{activeLang.nativeLabel}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-48 origin-top-right rounded-md bg-white border border-slate-200 shadow-lg ring-1 ring-black/5 z-50 py-1"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Language / மொழி / भाषा
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                role="menuitem"
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  isSelected ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex flex-col">
                  <span>{lang.nativeLabel}</span>
                  <span className="text-[10px] text-slate-400">{lang.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-slate-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
