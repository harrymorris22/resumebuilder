import type { ActionSuggestion } from '../../types/chat';

export function ActionSuggestionCard({
  suggestion,
  onTry,
  disabled,
}: {
  suggestion: ActionSuggestion;
  onTry: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800" role="listitem">
      <p className="flex-1 text-xs text-gray-700 dark:text-gray-300">{suggestion.text}</p>
      <button
        onClick={onTry}
        disabled={disabled}
        className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        Try this
      </button>
    </div>
  );
}
