import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { WizardShell } from './components/wizard/WizardShell';

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
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white`}>
      <Header />
      <WizardShell />
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
