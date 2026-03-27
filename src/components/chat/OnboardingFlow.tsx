export function OnboardingFlow({
  onSend,
  onUpload,
}: {
  onSend: (prompt: string) => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
          Your AI Career Coach
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          I'll help you build a compelling resume, strengthen your bullets, and tailor for each job application.
        </p>

        <div className="space-y-3">
          <button
            onClick={onUpload}
            className="w-full px-4 py-3 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload existing resume
          </button>

          <button
            onClick={() => onSend("Let's start building my resume from scratch. Ask me about my background, starting with my current role.")}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
          >
            Start from scratch
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-700">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Steps: Upload or create → AI analyzes → Fix weak points → Tailor to jobs
          </p>
        </div>
      </div>
    </div>
  );
}
