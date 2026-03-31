import { useState, useCallback, useRef } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../stores/useAppStore';
import { getClient } from '../services/anthropic';
import { resumeTools } from '../services/tools';
import { buildGenerateResumePrompt } from '../services/systemPrompt';
import { handleToolCall } from '../services/toolHandler';
import { createDefaultResume } from '../utils/resumeDefaults';

const MAX_TOOL_ITERATIONS = 15;

// Sections we expect the AI to populate
const EXPECTED_SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills'] as const;

export type GenerationSection = {
  name: string;
  status: 'pending' | 'done' | 'in-progress';
};

export function useGenerateResume() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<GenerationSection[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiKey = useAppStore((s) => s.apiKey);
  const addResume = useAppStore((s) => s.addResume);
  const updateResume = useAppStore((s) => s.updateResume);
  const setActiveResumeId = useAppStore((s) => s.setActiveResumeId);
  const setGeneratedResumeId = useAppStore((s) => s.setGeneratedResumeId);
  const addContentBankItem = useAppStore((s) => s.addContentBankItem);

  const generate = useCallback(
    async (templateId?: string) => {
      const state = useAppStore.getState();
      const jd = state.jobDescriptions.find((j) => j.id === state.activeJobDescriptionId);
      if (!apiKey || !jd || state.contentPool.length === 0) {
        setError('Missing API key, job description, or content pool.');
        return;
      }

      setIsGenerating(true);
      setError(null);
      setWarning(null);

      // Initialize progress checklist
      const initialSections: GenerationSection[] = [
        { name: 'Contact Info', status: 'pending' },
        { name: 'Summary', status: 'pending' },
        { name: 'Experience', status: 'pending' },
        { name: 'Education', status: 'pending' },
        { name: 'Skills', status: 'pending' },
        { name: 'Projects', status: 'pending' },
        { name: 'Certifications', status: 'pending' },
      ];
      setSections(initialSections);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Create a fresh resume entity
        const newResume = createDefaultResume();
        newResume.name = `${jd.title} at ${jd.company}`;
        newResume.targetJobId = jd.id;
        if (templateId) {
          newResume.templateId = templateId as 'classic' | 'modern' | 'minimal' | 'creative';
        }
        addResume(newResume);
        setActiveResumeId(newResume.id);
        setGeneratedResumeId(newResume.id);

        const client = getClient(apiKey);
        const systemPrompt = buildGenerateResumePrompt(state.contentPool, jd);

        let iterations = 0;
        let currentMessages: Anthropic.Messages.MessageParam[] = [
          { role: 'user', content: 'Generate the resume now. Call the tools to build each section.' },
        ];

        // Track which tool names map to which progress sections
        const toolToSection: Record<string, string> = {
          update_contact: 'Contact Info',
          set_summary: 'Summary',
          add_experience: 'Experience',
          update_experience_bullets: 'Experience',
          add_education: 'Education',
          add_skills: 'Skills',
          add_project: 'Projects',
          add_certification: 'Certifications',
        };

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
            if (controller.signal.aborted) break;

            // Update progress: mark section as in-progress
            const sectionName = toolToSection[toolUse.name];
            if (sectionName) {
              setSections((prev) =>
                prev.map((s) =>
                  s.name === sectionName ? { ...s, status: 'in-progress' } : s
                )
              );
            }

            const freshResume = useAppStore.getState().resumes.find((r) => r.id === newResume.id);
            if (!freshResume) break;

            const result = handleToolCall(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              { resume: freshResume, updateResume, addContentBankItem }
            );

            // Update progress: mark section as done
            if (sectionName) {
              setSections((prev) =>
                prev.map((s) =>
                  s.name === sectionName ? { ...s, status: 'done' } : s
                )
              );
            }

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

        // Check for incomplete sections
        if (!controller.signal.aborted) {
          const finalResume = useAppStore.getState().resumes.find((r) => r.id === newResume.id);
          if (finalResume) {
            const emptySections: string[] = [];
            for (const expected of EXPECTED_SECTIONS) {
              const section = finalResume.sections.find((s) => s.content.type === expected);
              if (!section) {
                emptySections.push(expected);
                continue;
              }
              // Check if the section has actual content
              const content = section.content;
              if (content.type === 'experience' && content.data.items.length === 0) emptySections.push('experience');
              else if (content.type === 'education' && content.data.items.length === 0) emptySections.push('education');
              else if (content.type === 'skills' && content.data.categories.length === 0) emptySections.push('skills');
              else if (content.type === 'summary' && !content.data.text) emptySections.push('summary');
            }

            if (emptySections.length > 0) {
              setWarning(
                `AI completed most sections but these need attention: ${emptySections.join(', ')}. You can edit them manually or click Retry.`
              );
            }

            // Mark remaining sections as done in progress UI
            setSections((prev) =>
              prev.map((s) => ({
                ...s,
                status: emptySections.includes(s.name.toLowerCase()) ? 'pending' : 'done',
              }))
            );
          }
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
    [apiKey, addResume, updateResume, setActiveResumeId, setGeneratedResumeId, addContentBankItem]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    generate,
    isGenerating,
    error,
    warning,
    sections,
    abort,
  };
}
