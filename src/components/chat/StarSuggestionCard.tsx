import type { StarSuggestion } from '../../types/chat';

interface StarSuggestionCardProps {
  suggestion: StarSuggestion;
  onAccept: () => void;
  onReject: () => void;
}

export function StarSuggestionCard({ suggestion, onAccept, onReject }: StarSuggestionCardProps) {
  if (suggestion.status !== 'pending') {
    return (
      <div className="mx-3 mb-3 p-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50 text-sm">
        <div className="flex items-center gap-1 text-xs text-stone-500">
          {suggestion.status === 'accepted' ? (
            <span className="text-emerald-500">&#10003; Accepted</span>
          ) : (
            <span className="text-stone-400">&#10005; Rejected</span>
          )}
          <span>STAR rewrite</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-stone-800 text-sm">
      <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">
        STAR Format Suggestion
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-stone-500 mb-1">Original</div>
          <p className="text-stone-600 dark:text-stone-400 text-sm line-through">
            {suggestion.originalText}
          </p>
        </div>
        <div>
          <div className="text-xs text-emerald-600 mb-1">Improved</div>
          <p className="text-stone-800 dark:text-stone-200 text-sm">
            {suggestion.starText}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onAccept}
          className="px-3 py-1 text-xs rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 text-xs rounded-md border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
