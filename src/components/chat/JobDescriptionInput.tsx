import { useState } from 'react';

interface JobDescriptionInputProps {
  onSubmit: (text: string) => void;
}

export function JobDescriptionInput({ onSubmit }: JobDescriptionInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-stone-600 dark:text-stone-300">
        Paste the job description below. I'll analyze it and help tailor your resume.
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the full job description here..."
        className="w-full h-32 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Analyze Job Description
      </button>
    </div>
  );
}
