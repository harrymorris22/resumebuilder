import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-stone-50 dark:bg-stone-700/50 text-stone-800 dark:text-stone-200'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-600">
            {message.toolCalls.map((tc, i) => (
              <div
                key={i}
                className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5"
              >
                <span className="text-emerald-500">&#10003;</span>
                <span>{formatToolName(tc.toolName)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
