import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { resumeTools } from '../services/tools';
import { buildPoolRecommendationPrompt, buildJdPoolRecommendationPrompt, buildRefinePrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import { generateId } from '../utils/id';
import type { Recommendation } from '../types/recommendation';

const MAX_TOOL_ITERATIONS = 10;

export function useRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiKey = useAppStore((s) => s.apiKey);
  const recommendations = useAppStore((s) => s.recommendations);
  const setRecommendations = useAppStore((s) => s.setRecommendations);
  const updateRecommendation = useAppStore((s) => s.updateRecommendation);
  const setRecommendationsLoading = useAppStore((s) => s.setRecommendationsLoading);
  const updateResume = useAppStore((s) => s.updateResume);
  const addContentBankItem = useAppStore((s) => s.addContentBankItem);

  const runAiCall = useCallback(
    async (systemPrompt: string) => {
      if (!apiKey) {
        setError('No API key configured. Add your Anthropic API key in Settings.');
        return;
      }

      setIsLoading(true);
      setRecommendationsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const client = getClient(apiKey);
        const collectedRecs: Recommendation[] = [];

        let iterations = 0;
        let currentMessages: Anthropic.Messages.MessageParam[] = [
          { role: 'user', content: 'Analyze and provide recommendations.' },
        ];

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          if (controller.signal.aborted) break;

          const stream = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools: resumeTools,
          });

          const finalMessage = await stream.finalMessage();

          const toolUses = finalMessage.content.filter(
            (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
          );

          if (toolUses.length === 0 || finalMessage.stop_reason === 'end_turn') {
            break;
          }

          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            const activeResumeId = useAppStore.getState().activeResumeId;
            const resume = useAppStore.getState().resumes.find((r) => r.id === activeResumeId);

            if (!resume) break;

            const result = handleToolCall(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              {
                resume,
                updateResume,
                addContentBankItem,
                onActionSuggestion: (suggestions) => {
                  const recs: Recommendation[] = suggestions.map((s) => ({
                    id: generateId(),
                    text: s.text,
                    prompt: s.prompt,
                    preview: s.preview,
                    category: s.category === 'question' ? 'content' : s.category as Recommendation['category'],
                    priority: s.priority,
                    status: 'pending' as const,
                    relatedKeywords: [],
                  }));
                  collectedRecs.push(...recs);
                },
              }
            );

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

        if (!controller.signal.aborted) {
          setRecommendations(collectedRecs);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('401')) {
          setError('Invalid API key. Please check your key in Settings.');
        } else if (msg.includes('429')) {
          setError('Rate limited. Please wait a moment and try again.');
        } else {
          setError(`AI error: ${msg}`);
        }
      } finally {
        setIsLoading(false);
        setRecommendationsLoading(false);
        abortRef.current = null;
      }
    },
    [apiKey, updateResume, addContentBankItem, setRecommendations, setRecommendationsLoading]
  );

  const generatePoolRecommendations = useCallback(() => {
    const pool = useAppStore.getState().contentPool;
    if (pool.length === 0) return;
    const prompt = buildPoolRecommendationPrompt(pool);
    runAiCall(prompt);
  }, [runAiCall]);

  const generateJdRecommendations = useCallback((jobDescriptionId: string) => {
    const state = useAppStore.getState();
    const jd = state.jobDescriptions.find((j) => j.id === jobDescriptionId);
    if (!jd || state.contentPool.length === 0) return;
    const prompt = buildJdPoolRecommendationPrompt(state.contentPool, jd);
    runAiCall(prompt);
  }, [runAiCall]);

  const generateRefineRecommendations = useCallback(() => {
    const state = useAppStore.getState();
    const resume = state.resumes.find((r) => r.id === state.generatedResumeId);
    const jd = state.jobDescriptions.find((j) => j.id === state.activeJobDescriptionId);
    if (!resume || !jd) return;
    const prompt = buildRefinePrompt(resume, jd, state.contentPool);
    runAiCall(prompt);
  }, [runAiCall]);

  const executeRecommendation = useCallback(
    async (id: string) => {
      const rec = useAppStore.getState().recommendations.find((r) => r.id === id);
      if (!rec || !apiKey) return;

      updateRecommendation(id, { status: 'executing' });

      try {
        const client = getClient(apiKey);
        const state = useAppStore.getState();
        const resume = state.resumes.find((r) => r.id === state.activeResumeId);
        if (!resume) return;

        const stream = client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: `You are an expert career coach. Execute this specific recommendation on the resume.\n\nResume:\n${JSON.stringify(resume, null, 2)}`,
          messages: [{ role: 'user', content: rec.prompt }],
          tools: resumeTools,
        });

        const finalMessage = await stream.finalMessage();

        const toolUses = finalMessage.content.filter(
          (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
        );

        for (const toolUse of toolUses) {
          const freshResume = useAppStore.getState().resumes.find((r) => r.id === state.activeResumeId);
          if (!freshResume) break;

          handleToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            { resume: freshResume, updateResume, addContentBankItem }
          );
        }

        updateRecommendation(id, { status: 'accepted' });
      } catch {
        updateRecommendation(id, { status: 'pending' });
        setError('Failed to apply recommendation. Try again.');
      }
    },
    [apiKey, updateResume, addContentBankItem, updateRecommendation]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    generatePoolRecommendations,
    generateJdRecommendations,
    generateRefineRecommendations,
    executeRecommendation,
    abort,
  };
}
