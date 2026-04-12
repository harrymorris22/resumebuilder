import { useEffect, useRef, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { WizardShell } from './components/wizard/WizardShell';
import { FirestoreToast } from './components/layout/FirestoreToast';
import { LandingPage } from './components/landing/LandingPage';
import { MigrationModal } from './components/auth/MigrationModal';
import { isMigrationDone, hasLocalData, isFirestoreEmpty, markMigrationDone } from './utils/migration';

function AppContent() {
  const { uid, loading: authLoading, firebaseAvailable } = useAuth();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrateFromIdb = useAppStore((s) => s.hydrateFromIdb);

  // Track whether the user chose to continue without an account
  const [continueLocal, setContinueLocal] = useState(false);

  // Migration state: null = not checked, 'needed' = show modal, 'done' = dismissed
  const [migrationState, setMigrationState] = useState<null | 'needed' | 'done'>(null);
  const migrationCheckStarted = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    // If user is signed in, hydrate from their Firestore account
    if (uid) {
      hydrateFromIdb(uid);
      return;
    }

    // Not signed in but continuing locally: hydrate from IDB
    if (continueLocal || !firebaseAvailable) {
      hydrateFromIdb(null);
    }
  }, [authLoading, uid, hydrateFromIdb, continueLocal, firebaseAvailable]);

  // Check if IDB → Firestore migration is needed after hydration
  useEffect(() => {
    if (!uid || !hydrated || migrationState !== null || migrationCheckStarted.current) return;
    if (isMigrationDone(uid)) return;

    migrationCheckStarted.current = true;
    let cancelled = false;
    (async () => {
      const [firestoreEmpty, localExists] = await Promise.all([
        isFirestoreEmpty(uid),
        hasLocalData(),
      ]);
      if (cancelled) return;
      setMigrationState(firestoreEmpty && localExists ? 'needed' : 'done');
    })();
    return () => { cancelled = true; };
  }, [uid, hydrated, migrationState]);

  // Always light mode — remove any stale dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Loading state (only when auth is resolving or actively hydrating)
  if (authLoading || (uid && !hydrated) || (continueLocal && !hydrated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page when not signed in and hasn't opted into local mode
  // If Firebase isn't configured, skip landing and go straight to app
  if (!uid && !continueLocal && firebaseAvailable) {
    return <LandingPage onContinueLocal={() => setContinueLocal(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900">
      <Header />
      <WizardShell />
      <SettingsModal />
      <FirestoreToast />
      {migrationState === 'needed' && uid && (
        <MigrationModal
          uid={uid}
          onComplete={() => {
            setMigrationState('done');
            // Re-hydrate from Firestore to pick up migrated data
            hydrateFromIdb(uid);
          }}
          onSkip={() => {
            markMigrationDone(uid);
            setMigrationState('done');
          }}
        />
      )}
    </div>
  );
}

// Placeholder: flush pending Firestore writes before sign-out.
// Currently persistence calls are fire-and-forget.
// If we add a write queue later, flush it here.
async function flushPendingWrites() {
  // no-op for now
}

export default function App() {
  return (
    <AuthProvider onBeforeSignOut={flushPendingWrites}>
      <AppContent />
    </AuthProvider>
  );
}
