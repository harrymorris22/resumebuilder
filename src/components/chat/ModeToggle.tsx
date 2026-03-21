import { useAppStore } from '../../stores/useAppStore';

export function ModeToggle() {
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);
  const updateChatSession = useAppStore((s) => s.updateChatSession);

  const session = chatSessions.find((s) => s.id === activeChatSessionId);
  if (!session) return null;

  const mode = session.mode;

  return (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
      <button
        onClick={() => updateChatSession({ ...session, mode: 'general' })}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          mode === 'general'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        General
      </button>
      <button
        onClick={() => updateChatSession({ ...session, mode: 'job-customisation' })}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          mode === 'job-customisation'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        Job Match
      </button>
    </div>
  );
}
