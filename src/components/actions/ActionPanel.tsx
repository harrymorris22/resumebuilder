import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useChat } from '../../hooks/useChat';
import { ActionCard } from './ActionCard';
import { FreeformInput } from './FreeformInput';
import { AiBanner } from './AiBanner';
import { OnboardingFlow } from '../chat/OnboardingFlow';
import { ModeToggle } from '../chat/ModeToggle';
import { JobDescriptionInput } from '../chat/JobDescriptionInput';
import { UploadResumeModal } from '../resume/UploadResumeModal';
import { ResumeScore } from '../resume/ResumeScore';

const MAX_VISIBLE_ACTIONS = 7;

export function ActionPanel() {
  const apiKey = useAppStore((s) => s.apiKey);
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);
  const pendingAutoMessage = useAppStore((s) => s.pendingAutoMessage);
  const setPendingAutoMessage = useAppStore((s) => s.setPendingAutoMessage);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const hasContent = activeResume && activeResume.sections.some(
    (s) => s.content.type === 'experience' && s.content.data.items.length > 0
  );

  const {
    sendMessage,
    abort,
    isStreaming,
    streamingText,
    error,
    actionSuggestions,
    dismissAction,
    executeAction,
    undoAction,
    undoCountdowns,
  } = useChat();

  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId);
  const isJobMode = activeSession?.mode === 'job-customisation';

  const [uploadOpen, setUploadOpen] = useState(false);
  const [jdSubmitted, setJdSubmitted] = useState(false);
  const [bannerText, setBannerText] = useState<string | null>(null);
  const prevStreamingRef = useRef(false);

  // Track AI text responses to show as banners
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && streamingText) {
      // Streaming just finished — show response as banner if it's meaningful
      const trimmed = streamingText.trim();
      if (trimmed.length > 10) {
        setBannerText(trimmed);
      }
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, streamingText]);

  // Handle pending auto message (from upload)
  useEffect(() => {
    if (pendingAutoMessage && !isStreaming && apiKey) {
      const msg = pendingAutoMessage;
      setPendingAutoMessage(null);
      setTimeout(() => sendMessage(msg), 500);
    }
  }, [pendingAutoMessage, isStreaming, apiKey, setPendingAutoMessage, sendMessage]);

  const handleSend = useCallback(
    (text: string) => {
      if (!apiKey) {
        setSettingsOpen(true);
        return;
      }
      sendMessage(text);
    },
    [apiKey, sendMessage, setSettingsOpen]
  );

  const handleExecute = useCallback(
    (id: string) => {
      if (!apiKey) {
        setSettingsOpen(true);
        return;
      }
      executeAction(id);
    },
    [apiKey, executeAction, setSettingsOpen]
  );

  // Progress tracking
  const pendingActions = actionSuggestions.filter((a) => a.status === 'pending');
  const completedActions = actionSuggestions.filter((a) => a.status === 'completed' || a.status === 'dismissed');
  const totalActions = pendingActions.length + completedActions.length;
  const progressPercent = totalActions > 0 ? Math.round((completedActions.length / totalActions) * 100) : 0;

  // Visible actions (cap at MAX)
  const visibleActions = actionSuggestions
    .filter((a) => a.status === 'pending' || a.status === 'executing' || (a.status === 'completed' && undoCountdowns.get(a.id)))
    .slice(0, MAX_VISIBLE_ACTIONS);

  // Show onboarding if no resume content and no actions
  const showOnboarding = !hasContent && actionSuggestions.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-stone-200 dark:border-stone-700 flex-shrink-0 bg-white dark:bg-stone-800">
        <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Coach</span>
        <div className="flex items-center gap-2">
          {apiKey && <ModeToggle />}
          {isStreaming && (
            <button
              onClick={abort}
              className="text-xs text-stone-400 hover:text-red-500 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Zone A: Score + Progress */}
      {activeResume && hasContent && (
        <div className="flex-shrink-0">
          <ResumeScore />
          {totalActions > 0 && (
            <div className="px-3 pb-2">
              <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 mb-1">
                <span>{completedActions.length} of {totalActions} addressed</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zone B: Action List */}
      <div className="flex-1 overflow-y-auto">
        {/* Job description input when in job mode */}
        {isJobMode && !jdSubmitted && apiKey && hasContent && (
          <JobDescriptionInput
            onSubmit={(text) => {
              setJdSubmitted(true);
              handleSend(`Please analyze this job description and help me tailor my resume. After your analysis, use suggest_actions to recommend specific changes:\n\n${text}`);
            }}
          />
        )}

        {showOnboarding ? (
          <OnboardingFlow onSend={handleSend} onUpload={() => setUploadOpen(true)} />
        ) : (
          <div className="p-3 space-y-2">
            {/* AI Banner */}
            {bannerText && (
              <AiBanner text={bannerText} onDismiss={() => setBannerText(null)} />
            )}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-center gap-2 p-3 text-sm text-stone-500 dark:text-stone-400">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span>{streamingText ? 'Working...' : 'Thinking...'}</span>
              </div>
            )}

            {/* Action Cards */}
            {visibleActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onExecute={handleExecute}
                onDismiss={dismissAction}
                onUndo={undoAction}
                isExecuting={action.status === 'executing'}
                undoCountdown={undoCountdowns.get(action.id) ?? null}
              />
            ))}

            {/* Empty state when actions were all addressed */}
            {!showOnboarding && visibleActions.length === 0 && !isStreaming && hasContent && (
              <div className="text-center py-8 text-sm text-stone-400 dark:text-stone-500">
                <p className="font-medium mb-1">All caught up!</p>
                <p>Ask a question below or upload a new resume to get more suggestions.</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone C: Freeform Input */}
      <div className="flex-shrink-0">
        <FreeformInput onSend={handleSend} disabled={isStreaming} />
      </div>

      <UploadResumeModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
