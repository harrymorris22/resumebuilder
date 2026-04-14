import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useGenerateInterviewQuestions } from '../../hooks/useGenerateInterviewQuestions';

export function InterviewQuestionsPanel() {
  const activeInterviewQuestions = useAppStore((s) => s.activeInterviewQuestions);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);

  const { generate, isGenerating, error, abort } = useGenerateInterviewQuestions();

  const [companyUrl, setCompanyUrl] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const hasPrerequisites = !!generatedResumeId && !!activeJobDescriptionId;
  const activeJd = jobDescriptions.find((j) => j.id === activeJobDescriptionId);

  const handleGenerate = useCallback(() => {
    generate(companyUrl || undefined);
  }, [generate, companyUrl]);

  const handleCopyAll = useCallback(async () => {
    if (!activeInterviewQuestions) return;
    try {
      await navigator.clipboard.writeText(activeInterviewQuestions.questions.join('\n\n'));
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Couldn\u2019t copy. Select text manually.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  }, [activeInterviewQuestions]);

  // --- No prerequisites ---
  if (!hasPrerequisites) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900">
        <div className="text-center px-8">
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            Generate a resume and select a job description first, then come back here to generate interview questions.
          </p>
        </div>
      </div>
    );
  }

  // --- No questions yet ---
  if (!activeInterviewQuestions) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900">
        <div className="text-center px-8 max-w-sm">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
            Generate smart, research-backed questions to ask at your interview
            {activeJd ? ` for ${activeJd.title} at ${activeJd.company}` : ''}.
          </p>

          {/* Company URL input */}
          <div className="mb-4">
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1 text-left">
              Company website (optional, helps generate specific questions)
            </label>
            <input
              type="text"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://company.com"
              disabled={isGenerating}
              className="w-full text-sm px-3 py-2 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 placeholder-stone-400 dark:placeholder-stone-500"
            />
          </div>

          {isGenerating ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </div>
              <button
                onClick={abort}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              Generate Questions
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Questions exist ---
  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-stone-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex-shrink-0">
        <button
          onClick={handleCopyAll}
          className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors"
        >
          {copyFeedback || 'Copy All'}
        </button>
        <span className="text-stone-300 dark:text-stone-600">|</span>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Regenerate'}
        </button>

        <div className="flex-1" />

        {activeInterviewQuestions.companyUrl && (
          <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[200px]">
            {activeInterviewQuestions.companyUrl}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="bg-white dark:bg-stone-800 shadow-lg w-full max-w-[8.5in] p-12">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
            Questions to Ask
          </h2>
          {activeJd && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-6">
              {activeJd.title} at {activeJd.company}
            </p>
          )}
          <ol className="space-y-3">
            {activeInterviewQuestions.questions.map((q, i) => (
              <li key={i} className="flex gap-3 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200 pt-0.5">
                  {q}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
