import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuth } from '../../contexts/AuthContext';

export function SettingsModal() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const apiKey = useAppStore((s) => s.apiKey);
  const setApiKey = useAppStore((s) => s.setApiKey);

  const { user, signIn, signOut, firebaseAvailable } = useAuth();

  const [localKey, setLocalKey] = useState(apiKey);
  const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when modal opens. setState here is intentional:
  // we need to reset form state each time the modal becomes visible.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settingsOpen) {
      setLocalKey(apiKey);
      setStatus('idle');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [settingsOpen, apiKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!settingsOpen) return null;

  const handleSave = () => {
    const trimmed = localKey.trim();
    setApiKey(trimmed);
    if (trimmed) {
      setStatus('valid');
      setTimeout(() => setSettingsOpen(false), 600);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setSettingsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <label htmlFor="api-key" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Anthropic API Key
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Your API key is stored locally in your browser and never sent to any server other than Anthropic's API.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="api-key"
              type="password"
              value={localKey}
              onChange={(e) => {
                setLocalKey(e.target.value);
                setStatus('idle');
              }}
              onKeyDown={handleKeyDown}
              placeholder="sk-ant-..."
              className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.readText().then((text) => {
                    setLocalKey(text);
                    setStatus('idle');
                  });
                } catch {
                  // Clipboard not available
                }
              }}
              className="px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-md hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
              title="Paste from clipboard"
            >
              Paste
            </button>
          </div>

          {status === 'valid' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Key saved!
            </p>
          )}
          {status === 'invalid' && (
            <p className="text-sm text-rose-600 dark:text-rose-400">
              Invalid API key. Please check and try again.
            </p>
          )}
        </div>

        {firebaseAvailable && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600">
            <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Account
            </h3>
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <p className="text-sm text-stone-900 dark:text-white">
                      {user.displayName || user.email}
                    </p>
                    {user.email && user.displayName && (
                      <p className="text-xs text-stone-500">{user.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Sign in to sync your data across devices.
                </p>
                <button
                  onClick={signIn}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 text-sm rounded-md border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!localKey.trim()}
            className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
