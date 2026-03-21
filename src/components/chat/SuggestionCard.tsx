import type { BankItemSuggestion } from '../../types/chat';
import { useAppStore } from '../../stores/useAppStore';

interface SuggestionCardProps {
  suggestion: BankItemSuggestion;
  onAccept: () => void;
  onReject: () => void;
}

export function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const items = useAppStore((s) => s.contentBankItems);
  const bankItem = items.find((i) => i.id === suggestion.bankItemId);

  if (suggestion.status !== 'pending') {
    return (
      <div className="mx-3 mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {suggestion.status === 'accepted' ? (
            <span className="text-emerald-500">&#10003; Accepted</span>
          ) : (
            <span className="text-gray-400">&#10005; Skipped</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Content Bank Suggestion
        </span>
        {suggestion.targetSection && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
            {suggestion.targetSection}
          </span>
        )}
      </div>

      {bankItem && (
        <p className="text-gray-800 dark:text-gray-200 mb-1">{bankItem.text}</p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {suggestion.reason}
      </p>

      <div className="flex gap-2">
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
          Skip
        </button>
      </div>
    </div>
  );
}
