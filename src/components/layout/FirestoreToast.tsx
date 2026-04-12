import { useState, useEffect, useCallback } from 'react';

/**
 * Listens for 'firestore-error' CustomEvents dispatched by the Firestore
 * persistence layer and AuthContext, then shows a brief toast notification.
 */
export function FirestoreToast() {
  const [message, setMessage] = useState<string | null>(null);

  const handleError = useCallback((e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail) setMessage(detail);
  }, []);

  useEffect(() => {
    window.addEventListener('firestore-error', handleError);
    return () => window.removeEventListener('firestore-error', handleError);
  }, [handleError]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-3 text-sm shadow-lg flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
        <button
          onClick={() => setMessage(null)}
          className="ml-auto text-rose-400 hover:text-rose-600 -mt-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
