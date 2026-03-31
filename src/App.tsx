import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { WizardShell } from './components/wizard/WizardShell';

function AppContent() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrateFromIdb = useAppStore((s) => s.hydrateFromIdb);

  useEffect(() => {
    hydrateFromIdb();
  }, [hydrateFromIdb]);

  // Always light mode — remove any stale dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900">
      <Header />
      <WizardShell />
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
