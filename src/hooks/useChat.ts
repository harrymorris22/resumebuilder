import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { resumeTools } from '../services/tools';
import { buildSystemPrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import { generateId } from '../utils/id';
import type { ChatMessage, StarSuggestion } from '../types/chat';
import type { ToolCallResult } from '../types/chat';

const MAX_TOOL_ITERATIONS = 10;

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [starSuggestions, setStarSuggestions] = useState<StarSuggestion[]>([]);
  const abortRef = useRef(false);

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

        // Build conversation history for API
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

          let responseText = '';
          const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

          for await (const event of stream) {
            if (abortRef.current) break;

            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                responseText += event.delta.text;
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

            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'input_json_delta' && toolUses.length > 0) {
                // The SDK handles JSON accumulation in the final message
              }
            }
          }

          // Get the final message to extract complete tool inputs
          const finalMessage = await stream.finalMessage();

          // Extract tool uses from the final message
          const finalToolUses = finalMessage.content
            .filter((block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use');

          if (finalToolUses.length === 0 || finalMessage.stop_reason === 'end_turn') {
            // No tool calls or final response — done
            break;
          }

          // Handle tool calls
          // Get fresh resume state for each tool call
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

          // Continue conversation with tool results
          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: finalMessage.content },
            { role: 'user' as const, content: toolResults },
          ];
        }

        if (iterations >= MAX_TOOL_ITERATIONS) {
          fullText += '\n\n*I got a bit carried away there. Could you rephrase your request?*';
        }

        // Save assistant message
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

      // If we have section/item/bullet info, update the resume
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
