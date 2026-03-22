import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { calculateResumeScore } from '../../utils/resumeScore';

export function ResumeScore() {
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const [expanded, setExpanded] = useState(false);

  const activeResume = resumes.find((r) => r.id === activeResumeId);
  if (!activeResume) return null;

  const { total, categories } = calculateResumeScore(activeResume);

  const color =
    total >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    total >= 50 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  const bgColor =
    total >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
    total >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';

  return (
    <div className={`mx-4 mt-2 rounded-lg border ${bgColor}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${color}`}>{total}/100</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Resume Score</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                <span className="text-gray-500 dark:text-gray-500">{cat.score}/{cat.maxScore}</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    cat.score === cat.maxScore ? 'bg-emerald-500' :
                    cat.score > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                />
              </div>
              {cat.tip !== 'Complete' && cat.tip !== 'Strong' && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{cat.tip}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
