import { useAppStore } from '../../stores/useAppStore';

export function ModeToggle() {
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);
  const updateChatSession = useAppStore((s) => s.updateChatSession);

  const session = chatSessions.find((s) => s.id === activeChatSessionId);
  if (!session) return null;

  const mode = session.mode;

  return (
    <div className="flex bg-stone-100 dark:bg-stone-700 rounded-md p-0.5">
      <button
        onClick={() => updateChatSession({ ...session, mode: 'general' })}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          mode === 'general'
            ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
        }`}
      >
        General
      </button>
      <button
        onClick={() => updateChatSession({ ...session, mode: 'job-customisation' })}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          mode === 'job-customisation'
            ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
        }`}
      >
        Job Match
      </button>
    </div>
  );
}
