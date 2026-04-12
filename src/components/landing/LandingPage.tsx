import { useAuth } from '../../contexts/AuthContext';

export function LandingPage({ onContinueLocal }: { onContinueLocal: () => void }) {
  const { signIn, firebaseAvailable } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-stone-200 bg-white flex-shrink-0">
        <h1 className="text-lg font-display font-semibold text-stone-900 tracking-tight">
          Resume Builder
        </h1>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <h2 className="text-3xl font-display font-bold text-stone-900 tracking-tight">
            Build resumes that land interviews
          </h2>
          <p className="mt-3 text-base text-stone-500 max-w-md mx-auto">
            AI-powered resume builder with a content pool system. Add your experience once, tailor it to every job in seconds.
          </p>

          {/* Feature grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
            <Feature
              icon={<PoolIcon />}
              title="Content Pool"
              desc="One master pool, many resumes"
            />
            <Feature
              icon={<AiIcon />}
              title="AI Tailoring"
              desc="Match any job description"
            />
            <Feature
              icon={<ExportIcon />}
              title="PDF & Word"
              desc="Export in both formats"
            />
            <Feature
              icon={<SyncIcon />}
              title="Cloud Sync"
              desc="Access from any device"
            />
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-3">
            {firebaseAvailable && (
              <button
                onClick={signIn}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-800 transition-colors shadow-sm"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            )}
            <button
              onClick={onContinueLocal}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              Continue without an account
            </button>
          </div>

          <p className="mt-6 text-xs text-stone-400">
            Your data stays in your browser until you sign in.
            {firebaseAvailable ? ' Sign in to sync across devices.' : ''}
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-stone-200">
      <div className="text-primary-600 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-stone-900">{title}</p>
        <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function PoolIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  );
}
