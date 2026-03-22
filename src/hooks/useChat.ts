import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { resumeTools } from '../services/tools';
import { buildSystemPrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import { generateId } from '../utils/id';
import type { ChatMessage, StarSuggestion, ActionSuggestion } from '../types/chat';
import type { ToolCallResult } from '../types/chat';
import type { Resume } from '../types/resume';

const MAX_TOOL_ITERATIONS = 10;
const UNDO_TIMEOUT_SECONDS = 5;

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [starSuggestions, setStarSuggestions] = useState<StarSuggestion[]>([]);
  const [actionSuggestions, setActionSuggestions] = useState<ActionSuggestion[]>([]);
  const [undoCountdowns, setUndoCountdowns] = useState<Map<string, number>>(new Map());
  const abortRef = useRef(false);
  const undoSnapshotsRef = useRef<Map<string, Resume>>(new Map());
  const undoTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const apiKey = useAppStore((s) => s.apiKey);
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);
  const contentBankItems = useAppStore((s) => s.contentBankItems);
  const updateChatSession = useAppStore((s) => s.updateChatSession);
  const updateResume = useAppStore((s) => s.updateResume);
  const addContentBankItem = useAppStore((s) => s.addContentBankItem);

  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId);

  // Merge new AI suggestions with existing ones
  const mergeActionSuggestions = useCallback((newSuggestions: ActionSuggestion[]) => {
    setActionSuggestions((prev) => {
      // Remove completed/dismissed cards (unless they have active undo countdowns)
      const kept = prev.filter(
        (a) => a.status === 'pending' || a.status === 'executing' ||
        (a.status === 'completed' && undoSnapshotsRef.current.has(a.id))
      );
      // Add new suggestions, cap at 7 total
      return [...newSuggestions, ...kept].slice(0, 7);
    });
  }, []);

  // Dismiss an action
  const dismissAction = useCallback((id: string) => {
    setActionSuggestions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'dismissed' as const } : a))
    );
    // Clean up after animation
    setTimeout(() => {
      setActionSuggestions((prev) => prev.filter((a) => a.id !== id));
    }, 300);
  }, []);

  // Start undo countdown for a completed action
  const startUndoCountdown = useCallback((actionId: string) => {
    setUndoCountdowns((prev) => new Map(prev).set(actionId, UNDO_TIMEOUT_SECONDS));

    const interval = setInterval(() => {
      setUndoCountdowns((prev) => {
        const current = prev.get(actionId);
        if (current === undefined || current <= 1) {
          clearInterval(interval);
          undoTimersRef.current.delete(actionId);
          undoSnapshotsRef.current.delete(actionId);
          const next = new Map(prev);
          next.delete(actionId);
          // Remove the completed card after undo window expires
          setActionSuggestions((actions) => actions.filter((a) => a.id !== actionId));
          return next;
        }
        return new Map(prev).set(actionId, current - 1);
      });
    }, 1000);

    undoTimersRef.current.set(actionId, interval);
  }, []);

  // Execute an action (click "Fix")
  const executeAction = useCallback(
    (id: string) => {
      const action = actionSuggestions.find((a) => a.id === id);
      if (!action || isStreaming) return;

      // Snapshot resume for undo
      const currentResume = useAppStore.getState().resumes.find((r) => r.id === activeResumeId);
      if (currentResume) {
        undoSnapshotsRef.current.set(id, structuredClone(currentResume));
      }

      // Mark as executing
      setActionSuggestions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'executing' as const } : a))
      );

      // Send the prompt
      sendMessage(action.prompt).then(() => {
        // Mark as completed
        setActionSuggestions((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'completed' as const } : a))
        );
        startUndoCountdown(id);
      });
    },
    [actionSuggestions, isStreaming, activeResumeId, startUndoCountdown]
    // Note: sendMessage is referenced but defined in the same scope — added below
  );

  // Undo an action
  const undoAction = useCallback(
    (id: string) => {
      const snapshot = undoSnapshotsRef.current.get(id);
      if (!snapshot) return;

      // Restore resume
      updateResume(snapshot);

      // Clear undo state
      const timer = undoTimersRef.current.get(id);
      if (timer) clearInterval(timer);
      undoTimersRef.current.delete(id);
      undoSnapshotsRef.current.delete(id);
      setUndoCountdowns((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      // Re-open the action as pending
      setActionSuggestions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'pending' as const } : a))
      );
    },
    [updateResume]
  );

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!apiKey || !activeResume || !activeSession || isStreaming) return;

      setIsStreaming(true);
      setError(null);
      setStreamingText('');
      abortRef.current = false;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...activeSession.messages, userMessage];
      const updatedSession = { ...activeSession, messages: updatedMessages };
      updateChatSession(updatedSession);

      try {
        const client = getClient(apiKey);
        const systemPrompt = buildSystemPrompt(
          activeResume,
          contentBankItems,
          activeSession.mode,
          activeSession.mode === 'job-customisation' ? activeSession.jobDescriptionId : undefined
        );

        const apiMessages: Anthropic.Messages.MessageParam[] = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        let iterations = 0;
        let currentMessages = apiMessages;
        let fullText = '';
        const allToolCalls: ToolCallResult[] = [];

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;

          if (abortRef.current) break;

          const stream = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools: resumeTools,
          });

          const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

          for await (const event of stream) {
            if (abortRef.current) break;

            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                fullText += event.delta.text;
                setStreamingText(fullText);
              }
            }

            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                toolUses.push({
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {} as Record<string, unknown>,
                });
              }
            }
          }

          const finalMessage = await stream.finalMessage();

          const finalToolUses = finalMessage.content
            .filter((block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use');

          if (finalToolUses.length === 0 || finalMessage.stop_reason === 'end_turn') {
            break;
          }

          const freshResume = useAppStore.getState().resumes.find((r) => r.id === activeResumeId);
          if (!freshResume) break;

          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const toolUse of finalToolUses) {
            const result = handleToolCall(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              {
                resume: useAppStore.getState().resumes.find((r) => r.id === activeResumeId) || freshResume,
                updateResume,
                addContentBankItem,
                onStarSuggestion: (s) => setStarSuggestions((prev) => [...prev, s]),
                onActionSuggestion: (suggestions) => {
                  mergeActionSuggestions(suggestions);
                },
              }
            );

            allToolCalls.push({
              toolName: toolUse.name,
              input: toolUse.input as Record<string, unknown>,
              result,
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
            });
          }

          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: finalMessage.content },
            { role: 'user' as const, content: toolResults },
          ];
        }

        if (iterations >= MAX_TOOL_ITERATIONS) {
          fullText += '\n\n*I got a bit carried away there. Could you rephrase your request?*';
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: fullText,
          timestamp: new Date().toISOString(),
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        };

        const finalSession = {
          ...activeSession,
          messages: [...updatedMessages, assistantMessage],
        };
        updateChatSession(finalSession);
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
      } finally {
        setIsStreaming(false);
        setStreamingText('');
      }
    },
    [
      apiKey,
      activeResume,
      activeSession,
      activeResumeId,
      isStreaming,
      contentBankItems,
      updateChatSession,
      updateResume,
      addContentBankItem,
      mergeActionSuggestions,
    ]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const acceptStarSuggestion = useCallback(
    (index: number) => {
      setStarSuggestions((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'accepted' };
        return updated;
      });

      const suggestion = starSuggestions[index];
      if (!suggestion || !activeResume) return;

      if (suggestion.sectionId && suggestion.itemId && suggestion.bulletIndex !== undefined) {
        const section = activeResume.sections.find((s) => s.id === suggestion.sectionId);
        if (section && section.content.type === 'experience') {
          const items = section.content.data.items.map((item) => {
            if (item.id === suggestion.itemId) {
              const bullets = [...item.bullets];
              bullets[suggestion.bulletIndex!] = suggestion.starText;
              return { ...item, bullets };
            }
            return item;
          });
          const updated = {
            ...activeResume,
            sections: activeResume.sections.map((s) =>
              s.id === suggestion.sectionId
                ? { ...s, content: { type: 'experience' as const, data: { items } } }
                : s
            ),
            updatedAt: new Date().toISOString(),
          };
          updateResume(updated);
        }
      }
    },
    [starSuggestions, activeResume, updateResume]
  );

  const rejectStarSuggestion = useCallback((index: number) => {
    setStarSuggestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'rejected' };
      return updated;
    });
  }, []);

  return {
    sendMessage,
    abort,
    isStreaming,
    streamingText,
    error,
    starSuggestions,
    acceptStarSuggestion,
    rejectStarSuggestion,
    actionSuggestions,
    dismissAction,
    executeAction,
    undoAction,
    undoCountdowns,
    messages: activeSession?.messages ?? [],
  };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('401') || err.message.includes('authentication')) {
      return 'Invalid API key. Please check your key in Settings.';
    }
    if (err.message.includes('429') || err.message.includes('rate')) {
      return 'Rate limited. Please wait a moment and try again.';
    }
    if (err.message.includes('network') || err.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
