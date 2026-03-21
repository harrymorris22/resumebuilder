import type { StarSuggestion } from '../../types/chat';

interface StarSuggestionCardProps {
  suggestion: StarSuggestion;
  onAccept: () => void;
  onReject: () => void;
}

export function StarSuggestionCard({ suggestion, onAccept, onReject }: StarSuggestionCardProps) {
  if (suggestion.status !== 'pending') {
    return (
      <div className="mx-3 mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {suggestion.status === 'accepted' ? (
            <span className="text-emerald-500">&#10003; Accepted</span>
          ) : (
            <span className="text-gray-400">&#10005; Rejected</span>
          )}
          <span>STAR rewrite</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 text-sm">
      <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">
        STAR Format Suggestion
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Original</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-through">
            {suggestion.originalText}
          </p>
        </div>
        <div>
          <div className="text-xs text-emerald-600 mb-1">Improved</div>
          <p className="text-gray-800 dark:text-gray-200 text-sm">
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
          className="px-3 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
