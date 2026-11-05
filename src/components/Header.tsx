import { useState } from 'react';
import { Scale, Bell, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { User, NotificationItem } from '../types';
import { Language, translations } from '../i18n/translations';
import { LanguageSelector } from './LanguageSelector';

interface Props {
  user: User | null;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
}

export function Header({
  user,
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  onOpenAuth,
  onLogout,
  notifications,
  onOpenNotifications,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = (key: string) => translations[currentLanguage][key] || key;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNavLinks = () => {
    if (!user) {
      return [
        { id: 'overview', label: t('nav.home') },
        { id: 'advocates', label: t('nav.advocates') },
        { id: 'assistant', label: t('nav.assistant') },
      ];
    }
    if (user.role === 'admin') {
      return [
        { id: 'admin', label: t('nav.admin') },
        { id: 'advocates', label: t('nav.advocates') },
        { id: 'cases', label: t('nav.cases') },
        { id: 'documents', label: t('nav.documents') },
        { id: 'assistant', label: t('nav.assistant') },
      ];
    }
    if (user.role === 'advocate') {
      return [
        { id: 'dashboard', label: t('nav.home') },
        { id: 'requests', label: 'Consultation Requests' },
        { id: 'cases', label: t('nav.cases') },
        { id: 'documents', label: t('nav.documents') },
        { id: 'assistant', label: t('nav.assistant') },
      ];
    }
    // Citizen
    return [
      { id: 'dashboard', label: t('nav.home') },
      { id: 'cases', label: t('nav.cases') },
      { id: 'documents', label: t('nav.documents') },
      { id: 'advocates', label: t('nav.advocates') },
      { id: 'assistant', label: t('nav.assistant') },
      { id: 'settings', label: t('nav.settings') },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single Brand Wordmark & Institutional Scales Icon */}
          <button
            onClick={() => onTabChange(user ? 'dashboard' : 'overview')}
            className="flex items-center gap-2.5 text-left shrink-0 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center text-amber-400 shrink-0">
              <Scale size={20} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-950 font-['Outfit'] whitespace-nowrap">
                {t('brand.name')}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 whitespace-nowrap">
                {t('brand.subtitle')}
              </span>
            </div>
          </button>

          {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`text-xs font-semibold uppercase tracking-wider py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-slate-950 border-slate-900'
                      : 'text-slate-600 border-transparent hover:text-slate-950 hover:border-slate-300'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Notifications, LanguageSelector, User Account) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Selector */}
            <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />

            {user ? (
              <div className="flex items-center gap-2">
                {/* Notifications Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="View notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-amber-600 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile Pill */}
                <button
                  onClick={() => onTabChange('settings')}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <UserIcon size={14} className="text-slate-500" />
                  <span className="font-semibold text-slate-900 max-w-[120px] truncate">{user.fullName}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">({user.role})</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title={t('nav.logout')}
                  aria-label={t('nav.logout')}
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors whitespace-nowrap"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onTabChange(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md ${
                  activeTab === link.id ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
            {user && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs text-slate-500">
                <span>Signed in as <strong className="text-slate-800">{user.fullName}</strong></span>
                <button onClick={onLogout} className="text-rose-600 font-semibold">{t('nav.logout')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
