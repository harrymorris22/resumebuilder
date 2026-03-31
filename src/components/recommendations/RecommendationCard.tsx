import { useState } from 'react';
import type { Recommendation, RecommendationCategory } from '../../types/recommendation';

const CATEGORY_STYLES: Record<RecommendationCategory, { bg: string; text: string; label: string }> = {
  content: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', label: 'IMPROVE' },
  metrics: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'ADD METRICS' },
  structure: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', label: 'STRUCTURE' },
  missing: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'MISSING' },
  keyword: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', label: 'KEYWORD' },
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function RecommendationCard({ recommendation, onAccept, onDismiss }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_STYLES[recommendation.category];

  if (recommendation.status === 'dismissed') return null;

  if (recommendation.status === 'accepted') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm line-through opacity-70">{recommendation.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md p-3 transition-all duration-200 ${
        recommendation.status === 'executing' ? 'animate-pulse ring-1 ring-primary-300 dark:ring-primary-700' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Category badge + priority */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded ${cat.bg} ${cat.text}`}>
              {cat.label}
            </span>
            {recommendation.priority === 'high' && (
              <span className="text-[10px] font-medium text-rose-500">HIGH</span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-stone-800 dark:text-stone-200">{recommendation.text}</p>

          {/* Related keywords */}
          {recommendation.relatedKeywords && recommendation.relatedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {recommendation.relatedKeywords.map((kw) => (
                <span key={kw} className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Preview toggle */}
          {recommendation.preview && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Preview
            </button>
          )}

          {expanded && recommendation.preview && (
            <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-900 rounded text-xs text-stone-600 dark:text-stone-400 italic border-l-2 border-stone-300 dark:border-stone-600">
              {recommendation.preview}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {recommendation.status === 'executing' ? (
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <button
                onClick={() => onAccept(recommendation.id)}
                className="px-2.5 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => onDismiss(recommendation.id)}
                className="p-1 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
