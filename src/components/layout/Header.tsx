import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuth } from '../../contexts/AuthContext';
import { WIZARD_STEP_LABELS } from '../../types/wizard';
import { ResumeLibrary } from '../wizard/ResumeLibrary';
import { ContentPoolDrawer } from '../contentPool/ContentPoolDrawer';
import { InterviewPrepDrawer } from '../interviewPrep/InterviewPrepDrawer';
import { SignInButton } from '../auth/SignInButton';
import { UserMenu } from '../auth/UserMenu';

export function Header() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const wizardStep = useAppStore((s) => s.wizardStep);
  const resumes = useAppStore((s) => s.resumes);
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const { user, firebaseAvailable } = useAuth();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const applicationsCount = useAppStore((s) => s.applications.length);

  return (
    <>
      <header className="flex items-center justify-between px-4 h-14 border-b border-stone-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          {currentView === 'applications' ? (
            <button
              onClick={() => setCurrentView('wizard')}
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
              title="Back to Resume Builder"
              aria-label="Back to Resume Builder"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="font-display font-semibold text-stone-900 text-lg tracking-tight">Resume Builder</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('applications')}
              className="text-lg font-display font-semibold text-stone-900 tracking-tight hover:text-stone-600 transition-colors cursor-pointer"
              title={`v${__APP_VERSION__} (${__COMMIT_HASH__}) — Open Applications`}
              aria-label="Open Applications"
            >
              Resume Builder
            </button>
          )}
          {currentView === 'wizard' && (
            <span className="text-xs text-stone-400 hidden sm:inline">
              {WIZARD_STEP_LABELS[wizardStep]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Content Pool button */}
          <button
            onClick={() => setPoolOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors flex items-center gap-1.5"
            title="Content Pool"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
            </svg>
            <span className="hidden sm:inline">Content Pool</span>
          </button>

          {/* Applications button */}
          <button
            onClick={() => setCurrentView('applications')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              currentView === 'applications'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
            }`}
            title="Applications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25v-4.072m16.5 0a2.25 2.25 0 00.659-1.591V9.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9.75v2.837c0 .621.255 1.178.659 1.591m16.5 0c.12-.088.236-.183.347-.284a2.25 2.25 0 00-.347-3.72m-16.5 0a2.25 2.25 0 00-.347 3.72c.111.101.228.196.347.284m0 0h16.5m-16.5 0c.283-.3.587-.58.906-.84m14.688.84c-.283-.3-.587-.58-.906-.84M8.25 7.5v-.75A2.25 2.25 0 0110.5 4.5h3a2.25 2.25 0 012.25 2.25v.75" />
            </svg>
            <span className="hidden sm:inline">Applications</span>
            {applicationsCount > 0 && (
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 rounded-full">
                {applicationsCount}
              </span>
            )}
          </button>

          {/* Interview Prep button */}
          <button
            onClick={() => setPrepOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors flex items-center gap-1.5"
            title="Interview Prep"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <span className="hidden sm:inline">Interview Prep</span>
          </button>

          {/* My Resumes button */}
          <button
            onClick={() => setLibraryOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors flex items-center gap-1.5"
            title="My Resumes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="hidden sm:inline">My Resumes</span>
            {resumes.length > 0 && (
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 rounded-full">
                {resumes.length}
              </span>
            )}
          </button>

          {firebaseAvailable && (user ? <UserMenu /> : <SignInButton />)}

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <ResumeLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <ContentPoolDrawer open={poolOpen} onClose={() => setPoolOpen(false)} />
      <InterviewPrepDrawer open={prepOpen} onClose={() => setPrepOpen(false)} />
    </>
  );
}
