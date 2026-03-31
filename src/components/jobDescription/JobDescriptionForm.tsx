import { useState } from 'react';

interface JobDescriptionFormProps {
  onSubmit: (rawText: string) => void;
  isLoading: boolean;
}

export function JobDescriptionForm({ onSubmit, isLoading }: JobDescriptionFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the full job description here..."
        className="w-full min-h-[200px] px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isLoading}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          !text.trim() || isLoading
            ? 'bg-primary-600/50 text-white/70 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {isLoading ? 'Analyzing...' : 'Save & Analyze'}
      </button>
    </div>
  );
}
