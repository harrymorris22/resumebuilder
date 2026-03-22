import { useEffect, useState } from 'react';

interface AiBannerProps {
  text: string;
  onDismiss: () => void;
}

export function AiBanner({ text, onDismiss }: AiBannerProps) {
  const [visible, setVisible] = useState(true);
  const isQuestion = text.trimEnd().endsWith('?');

  useEffect(() => {
    if (isQuestion) return; // Questions stay pinned
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isQuestion, onDismiss]);

  if (!visible) return null;

  return (
    <div className="mx-3 mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg text-sm text-gray-800 dark:text-gray-200 relative">
      <p className="pr-6">{text}</p>
      <button
        onClick={() => {
          setVisible(false);
          onDismiss();
        }}
        className="absolute top-2 right-2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {isQuestion && (
        <p className="mt-1 text-xs text-primary-500 dark:text-primary-400">
          Reply below to answer
        </p>
      )}
    </div>
  );
}
