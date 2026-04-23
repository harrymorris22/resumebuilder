import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useGenerateInterviewAnswer } from '../../hooks/useGenerateInterviewAnswer';
import type { InterviewPrepQuestion } from '../../constants/interviewPrepQuestions';

interface InterviewPrepCardProps {
  question: InterviewPrepQuestion;
}

const CATEGORY_LABELS: Record<InterviewPrepQuestion['category'], string> = {
  opener: 'Opener',
  behavioural: 'Behavioural',
  'strengths-weaknesses': 'Strengths / Weaknesses',
  motivation: 'Motivation',
};

export function InterviewPrepCard({ question }: InterviewPrepCardProps) {
  const bullets = useAppStore((s) => s.interviewPrep?.answers[question.id] ?? null);
  const clearAnswer = useAppStore((s) => s.clearInterviewPrepAnswer);

  const { generate, isGenerating, error, abort } = useGenerateInterviewAnswer(question);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    if (!bullets || bullets.length === 0) return;
    const text = `${question.question}\n\n${bullets.map((b) => `- ${b}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Couldn\u2019t copy.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  }, [bullets, question.question]);

  return (
    <div className="p-4 bg-white rounded-lg border border-stone-200">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-stone-900 leading-snug">
            {question.question}
          </h3>
          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide text-stone-500 bg-stone-100 rounded px-1.5 py-0.5">
            {CATEGORY_LABELS[question.category]}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="my-2 px-3 py-2 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
          {error}
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="my-2 flex items-center gap-2 text-xs text-stone-500">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
          <button
            onClick={abort}
            className="ml-2 text-stone-400 hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bullets */}
      {bullets && bullets.length > 0 && !isGenerating && (
        <ul className="space-y-2 mt-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-3 p-3 bg-stone-50 rounded-lg">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-stone-800 flex-1">
                {b}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3">
        {!bullets || bullets.length === 0 ? (
          !isGenerating && (
            <button
              onClick={() => generate()}
              disabled={isGenerating}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50"
            >
              Generate Answer
            </button>
          )
        ) : (
          !isGenerating && (
            <>
              <button
                onClick={handleCopy}
                className="text-xs text-stone-500 hover:text-primary-600 transition-colors"
              >
                {copyFeedback || 'Copy'}
              </button>
              <span className="text-stone-300">|</span>
              <button
                onClick={() => generate()}
                className="text-xs text-stone-500 hover:text-primary-600 transition-colors"
              >
                Regenerate
              </button>
              <span className="text-stone-300">|</span>
              <button
                onClick={() => clearAnswer(question.id)}
                className="text-xs text-stone-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}
