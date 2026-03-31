import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { WIZARD_STEP_LABELS } from '../../types/wizard';
import { ResumeLibrary } from '../wizard/ResumeLibrary';
import { ContentPoolDrawer } from '../contentPool/ContentPoolDrawer';

export function Header() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const wizardStep = useAppStore((s) => s.wizardStep);
  const resumes = useAppStore((s) => s.resumes);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 h-14 border-b border-stone-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-display font-semibold text-stone-900 tracking-tight">
            Resume Builder
          </h1>
          <span className="text-xs text-stone-400 hidden sm:inline">
            {WIZARD_STEP_LABELS[wizardStep]}
          </span>
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
    </>
  );
}
