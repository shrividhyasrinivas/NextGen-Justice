import { useState, useEffect } from 'react';
import { User, Advocate, NotificationItem } from './types';
import { api, tokenStore } from './lib/api';
import { Language } from './i18n/translations';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { CitizenDashboard } from './components/CitizenDashboard';
import { CasesPage } from './components/CasesPage';
import { DocumentsPage } from './components/DocumentsPage';
import { AdvocateDirectoryPage } from './components/AdvocateDirectoryPage';
import { LegalAssistantPage } from './components/LegalAssistantPage';
import { SettingsPage } from './components/SettingsPage';
import { AdvocateDashboard } from './components/AdvocateDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { ConsultationModal } from './components/ConsultationModal';
import { NotificationsModal } from './components/NotificationsModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation context
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [targetAdvocate, setTargetAdvocate] = useState<Advocate | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Check current session
  useEffect(() => {
    async function initAuth() {
      const token = tokenStore.get();
      if (token) {
        try {
          const res = await api.auth.me();
          if (res.user) {
            setUser(res.user);
            setActiveTab('dashboard');
            loadNotifications();
          }
        } catch {
          tokenStore.clear();
          setUser(null);
        }
      }
    }
    initAuth();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.list();
      setNotifications(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveTab(authenticatedUser.role === 'admin' ? 'admin' : authenticatedUser.role === 'advocate' ? 'dashboard' : 'dashboard');
    loadNotifications();
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setActiveTab('overview');
    setNotifications([]);
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenConsultationModal = (advocate: Advocate) => {
    setTargetAdvocate(advocate);
    setIsConsultationModalOpen(true);
  };

  const handleNavigateToDocuments = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab('documents');
  };

  const handleNavigateToAssistant = (caseId?: string, docId?: string) => {
    if (caseId) setSelectedCaseId(caseId);
    if (docId) setSelectedDocId(docId);
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* 3-Zone Top Bar */}
      <Header
        user={user}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'cases') setSelectedCaseId(null);
        }}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <LandingPage
            currentLanguage={currentLanguage}
            onGetStarted={() => {
              if (user) setActiveTab('dashboard');
              else handleOpenAuth('register');
            }}
            onExploreAdvocates={() => setActiveTab('advocates')}
            onOpenAssistant={() => setActiveTab('assistant')}
          />
        )}

        {activeTab === 'dashboard' && (
          user?.role === 'advocate' ? (
            <AdvocateDashboard
              user={user}
              onNavigateToCase={(caseId) => {
                setSelectedCaseId(caseId);
                setActiveTab('cases');
              }}
            />
          ) : user?.role === 'admin' ? (
            <AdminDashboard />
          ) : user ? (
            <CitizenDashboard
              user={user}
              currentLanguage={currentLanguage}
              onNavigate={(tab, caseId) => {
                if (caseId) setSelectedCaseId(caseId);
                setActiveTab(tab);
              }}
              onOpenConsultationModal={handleOpenConsultationModal}
            />
          ) : (
            <LandingPage
              currentLanguage={currentLanguage}
              onGetStarted={() => handleOpenAuth('register')}
              onExploreAdvocates={() => setActiveTab('advocates')}
              onOpenAssistant={() => setActiveTab('assistant')}
            />
          )
        )}

        {activeTab === 'cases' && (
          <CasesPage
            user={user || { id: 'anon', fullName: 'Citizen', email: '', role: 'citizen' }}
            selectedCaseId={selectedCaseId}
            onClearSelectedCase={() => setSelectedCaseId(null)}
            onNavigateToDocuments={handleNavigateToDocuments}
            onNavigateToAssistant={handleNavigateToAssistant}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsPage
            user={user || { id: 'anon', fullName: 'Citizen', email: '', role: 'citizen' }}
            initialCaseId={selectedCaseId}
            onNavigateToAssistant={handleNavigateToAssistant}
          />
        )}

        {activeTab === 'advocates' && (
          <AdvocateDirectoryPage
            user={user}
            onOpenConsultationModal={handleOpenConsultationModal}
          />
        )}

        {activeTab === 'assistant' && (
          <LegalAssistantPage
            user={user}
            currentLanguage={currentLanguage}
            initialCaseId={selectedCaseId}
            initialDocId={selectedDocId}
          />
        )}

        {activeTab === 'settings' && user && (
          <SettingsPage
            user={user}
            currentLanguage={currentLanguage}
            onUserUpdated={setUser}
          />
        )}

        {activeTab === 'requests' && user && (
          <AdvocateDashboard
            user={user}
            onNavigateToCase={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveTab('cases');
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />

      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => {
          setIsConsultationModalOpen(false);
          setTargetAdvocate(null);
        }}
        advocate={targetAdvocate}
        user={user}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onRefresh={loadNotifications}
        onNavigate={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
