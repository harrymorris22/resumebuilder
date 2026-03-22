import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useChat } from '../../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { StarSuggestionCard } from './StarSuggestionCard';
import { ModeToggle } from './ModeToggle';
import { JobDescriptionInput } from './JobDescriptionInput';

export function ChatPanel() {
  const apiKey = useAppStore((s) => s.apiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);
  const [input, setInput] = useState('');
  const [jdSubmitted, setJdSubmitted] = useState(false);

  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId);
  const isJobMode = activeSession?.mode === 'job-customisation';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    sendMessage,
    abort,
    isStreaming,
    streamingText,
    error,
    messages,
    starSuggestions,
    acceptStarSuggestion,
    rejectStarSuggestion,
  } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, starSuggestions]);

  const resizeTextarea = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    sendMessage(trimmed);
    // Reset textarea height after clearing
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 h-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Chat</span>
        <div className="flex items-center gap-2">
          {apiKey && <ModeToggle />}
          {isStreaming && (
            <button
              onClick={abort}
              className="text-xs text-rose-500 hover:text-rose-600"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" role="log" aria-live="polite">
        {isJobMode && !jdSubmitted && apiKey ? (
          <JobDescriptionInput
            onSubmit={(text) => {
              setJdSubmitted(true);
              sendMessage(`Please analyze this job description and help me tailor my resume:\n\n${text}`);
            }}
          />
        ) : !apiKey ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Hi! I'm your AI career coach. To get started, click the button
              below and enter your Anthropic API key.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="mt-2 px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              Open Settings
            </button>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 max-w-[85%] text-sm text-gray-700 dark:text-gray-300">
            <p>
              Hi! I'm your AI career coach. Let's build your resume together.
              What's your name and current role?
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {starSuggestions.map((suggestion, i) => (
              <StarSuggestionCard
                key={i}
                suggestion={suggestion}
                onAccept={() => acceptStarSuggestion(i)}
                onReject={() => rejectStarSuggestion(i)}
              />
            ))}

            {isStreaming && streamingText && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200">
                  <p className="whitespace-pre-wrap">{streamingText}</p>
                  <span className="inline-block w-1.5 h-4 bg-primary-500 animate-pulse ml-0.5" />
                </div>
              </div>
            )}

            {isStreaming && !streamingText && (
              <div className="flex justify-start mb-3">
                <div className="rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mx-2 mb-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-400">
            <p>{error}</p>
            <button
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                if (lastUserMsg) sendMessage(lastUserMsg.content);
              }}
              className="mt-1 text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              apiKey
                ? 'Type a message... (Shift+Enter for new line)'
                : 'Set your API key in Settings to start'
            }
            disabled={!apiKey || isStreaming}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[72px] max-h-[192px] overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={!apiKey || isStreaming || !input.trim()}
            className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
