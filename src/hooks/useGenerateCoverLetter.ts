import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { coverLetterTools } from '../services/tools';
import { buildCoverLetterPrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import type { CoverLetter, CoverLetterTone } from '../types/resume';

const MAX_TOOL_ITERATIONS = 5;

export function useGenerateCoverLetter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiKey = useAppStore((s) => s.apiKey);
  const addCoverLetter = useAppStore((s) => s.addCoverLetter);
  const setActiveCoverLetter = useAppStore((s) => s.setActiveCoverLetter);
  const updateResume = useAppStore((s) => s.updateResume);
  const addContentBankItem = useAppStore((s) => s.addContentBankItem);

  const generate = useCallback(
    async (tone?: CoverLetterTone, onComplete?: () => void) => {
      const state = useAppStore.getState();
      const resume = state.resumes.find((r) => r.id === state.generatedResumeId);
      const jd = state.jobDescriptions.find((j) => j.id === state.activeJobDescriptionId);

      if (!apiKey) {
        setError('No API key configured. Add your Anthropic API key in Settings.');
        return;
      }
      if (!resume) {
        setError('No resume found. Generate a resume first.');
        return;
      }
      if (!jd) {
        setError('No job description selected. Add a job description first.');
        return;
      }
      if (state.contentPool.length === 0) {
        setError('Content pool is empty. Add content first.');
        return;
      }

      setIsGenerating(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      let generated = false;

      try {
        const client = getClient(apiKey);
        const systemPrompt = buildCoverLetterPrompt(resume, state.contentPool, jd, tone);

        let iterations = 0;
        let currentMessages: Anthropic.Messages.MessageParam[] = [
          { role: 'user', content: 'Generate a cover letter for this job application. Call the generate_cover_letter tool with the full text.' },
        ];

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          if (controller.signal.aborted) break;

          const stream = client.messages.stream({
            model: 'claude-sonnet-4-5',
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools: coverLetterTools,
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
            if (controller.signal.aborted) break;

            const freshResume = useAppStore.getState().resumes.find((r) => r.id === resume.id);
            if (!freshResume) break;

            const result = handleToolCall(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              {
                resume: freshResume,
                updateResume,
                addContentBankItem,
                jobDescriptionId: jd.id,
                onCoverLetterGenerated: (letter: CoverLetter) => {
                  // Validate non-empty text
                  if (!letter.text || !letter.text.trim()) {
                    setError('Generated cover letter was empty. Try again.');
                    return;
                  }
                  const letterWithTone = { ...letter, tone: tone || 'professional' };
                  addCoverLetter(letterWithTone);
                  setActiveCoverLetter(letterWithTone);
                  generated = true;
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

        if (!controller.signal.aborted && !generated) {
          setError('AI could not generate a cover letter. Try again.');
        }

        if (!controller.signal.aborted && generated && onComplete) {
          onComplete();
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('401')) {
          setError('Invalid API key. Check Settings.');
        } else if (msg.includes('429')) {
          setError('Rate limited. Wait a moment and try again.');
        } else {
          setError(`Generation failed: ${msg}`);
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [apiKey, updateResume, addContentBankItem, addCoverLetter, setActiveCoverLetter]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { generate, isGenerating, error, abort };
}
