import { useState, useRef, useCallback } from 'react';

interface FreeformInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function FreeformInput({ onSend, disabled }: FreeformInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        disabled={disabled}
        className="flex-1 text-sm bg-transparent border-none outline-none text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 disabled:opacity-50"
      />
      {text.trim() && (
        <button
          onClick={handleSend}
          disabled={disabled}
          className="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 transition-colors"
          aria-label="Send"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}
    </div>
  );
}
