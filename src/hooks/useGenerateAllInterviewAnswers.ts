import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { interviewPrepTools } from '../services/tools';
import { buildInterviewAnswerPrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import { INTERVIEW_PREP_QUESTIONS, type InterviewPrepQuestion } from '../constants/interviewPrepQuestions';

const CONCURRENCY = 3;
const MAX_TOOL_ITERATIONS = 3;

// Inline pLimit — no new dep
export function pLimit(n: number) {
  const queue: Array<() => void> = [];
  let active = 0;
  const next = () => {
    active--;
    const task = queue.shift();
    if (task) task();
  };
  return <T,>(fn: () => Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(resolve, reject).finally(next);
      };
      if (active < n) run();
      else queue.push(run);
    });
}

export interface GenerateAllProgress {
  done: number;
  total: number;
  failed: number;
}

export function useGenerateAllInterviewAnswers() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerateAllProgress>({ done: 0, total: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiKey = useAppStore((s) => s.apiKey);
  const updateInterviewPrepAnswer = useAppStore((s) => s.updateInterviewPrepAnswer);

  const generateAll = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (!apiKey) {
        setError('No API key configured. Add your Anthropic API key in Settings.');
        return;
      }

      const state = useAppStore.getState();
      const contentPool = state.contentPool;
      const existing = state.interviewPrep?.answers ?? {};
      const capturedUserId = state.userId;

      const targets: InterviewPrepQuestion[] = options.force
        ? INTERVIEW_PREP_QUESTIONS
        : INTERVIEW_PREP_QUESTIONS.filter((q) => !existing[q.id] || existing[q.id].length === 0);

      if (targets.length === 0) {
        setError(null);
        return;
      }

      setIsGenerating(true);
      setError(null);
      setProgress({ done: 0, total: targets.length, failed: 0 });

      const controller = new AbortController();
      abortRef.current = controller;

      const client = getClient(apiKey);

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

      const limit = pLimit(CONCURRENCY);

      const runOne = async (question: InterviewPrepQuestion) => {
        if (controller.signal.aborted) throw new Error('aborted');

        const systemPrompt = buildInterviewAnswerPrompt(question);

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

        let generated = false;

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          if (controller.signal.aborted) throw new Error('aborted');

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
          if (toolUses.length === 0 || finalMessage.stop_reason === 'end_turn') break;

          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            if (controller.signal.aborted) throw new Error('aborted');

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
                  // Sign-out mid-generation guard.
                  const nowUid = useAppStore.getState().userId;
                  if (nowUid !== capturedUserId) return;
                  if (!bullets || bullets.length === 0) return;
                  updateInterviewPrepAnswer(qid, bullets);
                  generated = true;
                },
              },
            );
            toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
          }

          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: finalMessage.content },
            { role: 'user' as const, content: toolResults },
          ];
        }

        if (!generated) throw new Error("AI didn't produce an answer");
      };

      const results = await Promise.allSettled(
        targets.map((q) =>
          limit(async () => {
            await runOne(q);
            setProgress((p) => ({ ...p, done: p.done + 1 }));
          }),
        ),
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      setProgress((p) => ({ ...p, failed }));

      setIsGenerating(false);
      abortRef.current = null;
    },
    [apiKey, updateInterviewPrepAnswer],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { generateAll, isGenerating, progress, error, abort };
}
