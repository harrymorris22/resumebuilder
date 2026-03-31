import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { ActionPanel } from '../actions/ActionPanel';

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const pendingAutoMessage = useAppStore((s) => s.pendingAutoMessage);

  // Auto-open when a pending message arrives (e.g. from Generate Recommendations)
  useEffect(() => {
    if (pendingAutoMessage) {
      setOpen(true);
    }
  }, [pendingAutoMessage]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Open AI Coach"
          title="AI Coach"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 right-6 z-50 w-[400px] h-[60vh] bg-white dark:bg-stone-800 rounded-t-xl shadow-2xl border border-stone-200 dark:border-stone-700 flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-10 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
              <span className="text-sm font-medium text-stone-900 dark:text-white">AI Coach</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ActionPanel content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ActionPanel />
            </div>
          </div>
        </>
      )}
    </>
  );
}
