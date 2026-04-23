// TODO: consider extracting a runAgenticTool() helper if a third consumer appears.
// For now we keep the ~80% structural overlap with useGenerateInterviewQuestions
// to keep the diff minimal (rule of 3).
import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { interviewPrepTools } from '../services/tools';
import { buildInterviewAnswerPrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import type { InterviewPrepQuestion } from '../constants/interviewPrepQuestions';

const MAX_TOOL_ITERATIONS = 3;

export function useGenerateInterviewAnswer(question: InterviewPrepQuestion) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiKey = useAppStore((s) => s.apiKey);
  const updateInterviewPrepAnswer = useAppStore((s) => s.updateInterviewPrepAnswer);

  const generate = useCallback(
    async () => {
      if (!apiKey) {
        setError('No API key configured. Add your Anthropic API key in Settings.');
        return;
      }

      const state = useAppStore.getState();
      const contentPool = state.contentPool;
      const capturedUserId = state.userId;

      setIsGenerating(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      let generated = false;

      try {
        const client = getClient(apiKey);
        const systemPrompt = buildInterviewAnswerPrompt(question);

        const poolJson = JSON.stringify(
          contentPool.slice(0, 200).map((e) => ({
            id: e.id,
            type: e.item.type,
            data: e.item.data,
            ...(e.item.type === 'bullet'
              ? { context: (e.item as { type: 'bullet'; context: unknown }).context }
              : {}),
          })),
          null,
          2,
        );

        let iterations = 0;
        let currentMessages: Anthropic.Messages.MessageParam[] = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Content Pool:\n${poolJson}`,
                cache_control: { type: 'ephemeral' },
              },
              {
                type: 'text',
                text: `Answer this question in 3-5 first-person bullets, grounded ONLY in the pool above. If the pool lacks material, output exactly 1 meta-bullet per the rules.\n\nQuestion (${question.id}): ${question.question}\n\nCall the generate_interview_answer tool with { questionId: "${question.id}", bullets: [...] }.`,
              },
            ],
          },
        ];

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          if (controller.signal.aborted) break;

          const stream = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: currentMessages,
            tools: interviewPrepTools,
          });

          const finalMessage = await stream.finalMessage();

          const toolUses = finalMessage.content.filter(
            (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
          );

          if (toolUses.length === 0 || finalMessage.stop_reason === 'end_turn') {
            break;
          }

          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            if (controller.signal.aborted) break;

            const freshState = useAppStore.getState();
            const freshResume = freshState.resumes[0];
            if (!freshResume) break;

            const result = handleToolCall(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              {
                resume: freshResume,
                updateResume: () => {},
                addContentBankItem: () => {},
                onInterviewAnswerGenerated: (qid: string, bullets: string[]) => {
                  // Sign-out mid-generation guard: if userId changed, drop the result.
                  const nowUid = useAppStore.getState().userId;
                  if (nowUid !== capturedUserId) return;
                  if (!bullets || bullets.length === 0) {
                    setError('Generated answer was empty. Try again.');
                    return;
                  }
                  updateInterviewPrepAnswer(qid, bullets);
                  generated = true;
                },
              },
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
          setError("AI didn't produce an answer — try again.");
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
    [apiKey, question, updateInterviewPrepAnswer],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { generate, isGenerating, error, abort };
}
