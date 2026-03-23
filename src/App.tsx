import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { MobileGate } from './components/layout/MobileGate';
import { Header } from './components/layout/Header';
import { SplitPane } from './components/layout/SplitPane';
import { SettingsModal } from './components/settings/SettingsModal';
import { ContentPoolPage } from './components/contentPool/ContentPoolPage';
import { ResumePreview } from './components/resume/ResumePreview';
import { FloatingChat } from './components/chat/FloatingChat';

function AppContent() {
  const hydrated = useAppStore((s) => s.hydrated);
  const darkMode = useAppStore((s) => s.darkMode);
  const hydrateFromIdb = useAppStore((s) => s.hydrateFromIdb);

  useEffect(() => {
    hydrateFromIdb();
  }, [hydrateFromIdb]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}>
      <Header />
      <SplitPane
        left={<ContentPoolPage />}
        right={
          <div className="flex flex-col h-full">
            <ResumePreview />
          </div>
        }
      />
      <FloatingChat />
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return (
    <MobileGate>
      <AppContent />
    </MobileGate>
  );
}
