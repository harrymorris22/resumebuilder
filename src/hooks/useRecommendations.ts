import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { resumeTools } from '../services/tools';
import { buildPoolRecommendationPrompt, buildJdPoolRecommendationPrompt, buildRefinePrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import { DEFENSE_PREAMBLE, wrapUserData } from '../utils/promptSafety';
import { generateId } from '../utils/id';
import type { Recommendation } from '../types/recommendation';

const MAX_TOOL_ITERATIONS = 10;

const VALID_MUTATION_TOOLS = [
  'set_summary', 'update_experience_bullets', 'add_experience',
  'add_education', 'add_skills', 'add_certification', 'add_project', 'update_contact',
];

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
            model: 'claude-sonnet-4-5',
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
                    mutation: s.mutation,
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
      if (!rec) return;

      updateRecommendation(id, { status: 'executing' });

      const state = useAppStore.getState();
      const resume = state.resumes.find((r) => r.id === state.activeResumeId);
      if (!resume) {
        updateRecommendation(id, { status: 'pending' });
        return;
      }

      // Snapshot current sections for before/after diff
      useAppStore.getState().setDiffSnapshot(structuredClone(resume.sections));

      if (rec.mutation) {
        // DETERMINISTIC PATH: validate then apply mutation directly
        if (!VALID_MUTATION_TOOLS.includes(rec.mutation.tool)) {
          updateRecommendation(id, { status: 'pending' });
          setError('Invalid suggestion data. Try regenerating suggestions.');
          return;
        }

        const freshResume = useAppStore.getState().resumes.find((r) => r.id === state.activeResumeId);
        if (!freshResume) return;

        handleToolCall(rec.mutation.tool, rec.mutation.input, {
          resume: freshResume,
          updateResume,
          addContentBankItem,
        });

        updateRecommendation(id, { status: 'accepted' });
      } else if (rec.prompt && apiKey) {
        // FALLBACK: LLM call for recommendations without mutation data
        try {
          const client = getClient(apiKey);

          let executionMessage = rec.prompt;
          if (rec.preview) {
            executionMessage += `\n\nIMPORTANT: The user was shown this exact preview of what the change would look like:\n"${rec.preview}"\n\nYou MUST produce output that matches this preview exactly.`;
          }

          const stream = client.messages.stream({
            model: 'claude-sonnet-4-5',
            max_tokens: 4096,
            system: `${DEFENSE_PREAMBLE}You are an expert career coach. Execute this specific recommendation on the resume.\n\n${wrapUserData('user-resume', JSON.stringify(resume, null, 2))}`,
            messages: [{ role: 'user', content: executionMessage }],
            tools: resumeTools,
            tool_choice: { type: 'any' as const },
          });

          const finalMessage = await stream.finalMessage();

          const toolUses = finalMessage.content.filter(
            (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
          );

          if (toolUses.length === 0) {
            updateRecommendation(id, { status: 'pending' });
            setError('Could not apply this suggestion. Try again.');
            return;
          }

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
      } else {
        updateRecommendation(id, { status: 'pending' });
        setError('Cannot apply this suggestion. No mutation data or API key.');
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
