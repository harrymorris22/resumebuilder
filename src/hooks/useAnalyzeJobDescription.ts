import { useState, useCallback } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { resumeTools } from '../services/tools';
import { handleToolCall } from '../services/toolHandler';
import { generateId } from '../utils/id';
import type { JobDescription } from '../types/resume';

export function useAnalyzeJobDescription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = useAppStore((s) => s.apiKey);
  const addJobDescription = useAppStore((s) => s.addJobDescription);
  const setActiveJobDescriptionId = useAppStore((s) => s.setActiveJobDescriptionId);
  const updateResume = useAppStore((s) => s.updateResume);
  const addContentBankItem = useAppStore((s) => s.addContentBankItem);

  const analyze = useCallback(
    async (rawText: string) => {
      if (!apiKey || !rawText.trim()) {
        setError('No API key or empty job description.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const client = getClient(apiKey);
        let analyzedJob: JobDescription | null = null;

        const stream = client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: `You are a job description analyzer. Extract the job title, company name, and important keywords from the job description. Call the analyze_job_description tool with the extracted information. Keywords should include: required skills, technologies, frameworks, soft skills, certifications, and any other important terms a resume should match.`,
          messages: [
            { role: 'user', content: `Analyze this job description:\n\n${rawText}` },
          ],
          tools: resumeTools,
        });

        const finalMessage = await stream.finalMessage();

        const toolUses = finalMessage.content.filter(
          (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
        );

        for (const toolUse of toolUses) {
          if (toolUse.name === 'analyze_job_description') {
            const input = toolUse.input as Record<string, unknown>;
            const jd: JobDescription = {
              id: generateId(),
              title: (input.title as string) || 'Untitled Position',
              company: (input.company as string) || 'Unknown Company',
              rawText,
              keywords: Array.isArray(input.keywords)
                ? input.keywords
                : typeof input.keywords === 'string'
                  ? (input.keywords as string).split(',').map((k: string) => k.trim()).filter(Boolean)
                  : [],
              createdAt: new Date().toISOString(),
            };
            analyzedJob = jd;
          } else {
            // Handle any other tool calls (unlikely but safe)
            const resume = useAppStore.getState().resumes.find(
              (r) => r.id === useAppStore.getState().activeResumeId
            );
            if (resume) {
              handleToolCall(
                toolUse.name,
                toolUse.input as Record<string, unknown>,
                { resume, updateResume, addContentBankItem }
              );
            }
          }
        }

        if (analyzedJob) {
          addJobDescription(analyzedJob);
          setActiveJobDescriptionId(analyzedJob.id);
        } else {
          setError('AI could not analyze this job description. Try a different posting.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('401')) {
          setError('Invalid API key. Check Settings.');
        } else if (msg.includes('429')) {
          setError('Rate limited. Wait a moment and try again.');
        } else {
          setError(`Analysis failed: ${msg}`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, addJobDescription, setActiveJobDescriptionId, updateResume, addContentBankItem]
  );

  return { analyze, isLoading, error };
}
