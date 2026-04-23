import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useGenerateAllInterviewAnswers } from '../../hooks/useGenerateAllInterviewAnswers';
import { INTERVIEW_PREP_QUESTIONS } from '../../constants/interviewPrepQuestions';
import { InterviewPrepCard } from './InterviewPrepCard';

export function InterviewPrepPage() {
  const contentPool = useAppStore((s) => s.contentPool);
  const interviewPrep = useAppStore((s) => s.interviewPrep);
  const clearAll = useAppStore((s) => s.clearAllInterviewPrepAnswers);

  const { generateAll, isGenerating, progress, error, abort } = useGenerateAllInterviewAnswers();

  const [copyAllFeedback, setCopyAllFeedback] = useState<string | null>(null);

  const answers = interviewPrep?.answers ?? {};
  const answeredCount = Object.keys(answers).filter((qid) => (answers[qid]?.length ?? 0) > 0).length;
  const hasAnswers = answeredCount > 0;

  const handleCopyAll = useCallback(async () => {
    if (!hasAnswers) return;
    const lines: string[] = [];
    for (const q of INTERVIEW_PREP_QUESTIONS) {
      const bullets = answers[q.id];
      if (!bullets || bullets.length === 0) continue;
      lines.push(q.question);
      lines.push('');
      for (const b of bullets) lines.push(`- ${b}`);
      lines.push('');
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n').trim());
      setCopyAllFeedback('Copied!');
      setTimeout(() => setCopyAllFeedback(null), 2000);
    } catch {
      setCopyAllFeedback('Couldn\u2019t copy.');
      setTimeout(() => setCopyAllFeedback(null), 3000);
    }
  }, [answers, hasAnswers]);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-500">
              Practice answers to common questions, drawn from your content pool.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isGenerating ? (
            <>
              <span className="text-xs text-stone-500">
                {progress.done} / {progress.total} answered...
                {progress.failed > 0 ? ` (${progress.failed} failed)` : ''}
              </span>
              <button
                onClick={abort}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => generateAll({ force: false })}
                disabled={contentPool.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50"
              >
                Generate All
              </button>
              <button
                onClick={handleCopyAll}
                disabled={!hasAnswers}
                className="text-xs text-stone-500 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                {copyAllFeedback || 'Copy All'}
              </button>
              {hasAnswers && (
                <>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-stone-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </>
              )}
              <span className="ml-auto text-[11px] text-stone-400">
                {answeredCount} / {INTERVIEW_PREP_QUESTIONS.length} answered
              </span>
            </>
          )}
        </div>

        {error && (
          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Empty pool banner */}
      {contentPool.length === 0 && (
        <div className="mx-4 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
          Add entries to your Content Pool first (work experience, projects, skills) so the AI has real material to draw from.
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {INTERVIEW_PREP_QUESTIONS.map((q) => (
          <InterviewPrepCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
