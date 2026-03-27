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
      <div className="mx-3 mb-3 p-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50 text-sm">
        <div className="flex items-center gap-1 text-xs text-stone-500">
          {suggestion.status === 'accepted' ? (
            <span className="text-emerald-500">&#10003; Accepted</span>
          ) : (
            <span className="text-stone-400">&#10005; Skipped</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-stone-800 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Content Bank Suggestion
        </span>
        {suggestion.targetSection && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-500">
            {suggestion.targetSection}
          </span>
        )}
      </div>

      {bankItem && (
        <p className="text-stone-800 dark:text-stone-200 mb-1">{bankItem.text}</p>
      )}

      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
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
          className="px-3 py-1 text-xs rounded-md border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
