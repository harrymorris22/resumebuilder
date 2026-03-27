import { useAppStore } from '../../stores/useAppStore';
import { ThemeToggle } from './ThemeToggle';
import { TemplateSelector } from '../resume/TemplateSelector';
import { ResumeMenu } from './ResumeMenu';

export function Header() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-display font-semibold text-stone-900 dark:text-white tracking-tight">
          Resume Builder
        </h1>
        <ResumeMenu />
      </div>

      <div className="flex items-center gap-1">
        <TemplateSelector />
        <ThemeToggle />
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 transition-colors"
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
  );
}
