import type { ActionSuggestion } from '../../types/chat';

export function CoachNote({
  suggestion,
  onFix,
  disabled,
}: {
  suggestion: ActionSuggestion | null;
  onFix: (prompt: string) => void;
  disabled?: boolean;
}) {
  if (!suggestion) return null;

  return (
    <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
      <p className="flex-1 text-xs text-amber-800 dark:text-amber-300">{suggestion.text}</p>
      <button
        onClick={() => onFix(suggestion.prompt)}
        disabled={disabled}
        className="px-2 py-1 text-xs font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        Fix
      </button>
    </div>
  );
}
