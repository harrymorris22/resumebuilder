import { useState } from 'react';
import type { ActionSuggestion } from '../../types/chat';

const CATEGORY_COLORS: Record<ActionSuggestion['category'], string> = {
  content: 'border-l-blue-500',
  metrics: 'border-l-amber-500',
  structure: 'border-l-purple-500',
  missing: 'border-l-emerald-500',
  question: 'border-l-gray-400',
};

const CATEGORY_LABELS: Record<ActionSuggestion['category'], string> = {
  content: 'Improve',
  metrics: 'Add metrics',
  structure: 'Structure',
  missing: 'Missing',
  question: 'Question',
};

interface ActionCardProps {
  action: ActionSuggestion;
  onExecute: (id: string) => void;
  onDismiss: (id: string) => void;
  onUndo?: (id: string) => void;
  isExecuting: boolean;
  undoCountdown?: number | null;
}

export function ActionCard({ action, onExecute, onDismiss, onUndo, isExecuting, undoCountdown }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (action.status === 'dismissed') return null;

  if (action.status === 'completed') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm line-through opacity-70">{action.text}</span>
          </div>
          {undoCountdown !== null && undoCountdown !== undefined && undoCountdown > 0 && onUndo && (
            <button
              onClick={() => onUndo(action.id)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline"
            >
              Undo ({undoCountdown}s)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${CATEGORY_COLORS[action.category]} rounded-lg p-3 transition-all duration-200 ${
        isExecuting ? 'animate-pulse ring-1 ring-primary-300 dark:ring-primary-700' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {CATEGORY_LABELS[action.category]}
            </span>
            {action.priority === 'high' && (
              <span className="text-[10px] font-medium text-rose-500">HIGH</span>
            )}
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200">{action.text}</p>

          {action.preview && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Preview
            </button>
          )}

          {expanded && action.preview && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600">
              {action.preview}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isExecuting ? (
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <button
                onClick={() => onExecute(action.id)}
                className="px-2.5 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Fix
              </button>
              <button
                onClick={() => onDismiss(action.id)}
                className="p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
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
