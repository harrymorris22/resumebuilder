import { describe, it, expect } from 'vitest';
import { resumeTools, interviewPrepTools } from './tools';

describe('resumeTools', () => {
  it('includes generate_interview_answer', () => {
    const names = resumeTools.map((t) => t.name);
    expect(names).toContain('generate_interview_answer');
  });

  it('generate_interview_answer has required schema fields', () => {
    const tool = resumeTools.find((t) => t.name === 'generate_interview_answer');
    expect(tool).toBeDefined();
    if (!tool) return;
    const schema = tool.input_schema as {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
    };
    expect(schema.type).toBe('object');
    expect(schema.properties.questionId).toBeDefined();
    expect(schema.properties.bullets).toBeDefined();
    expect(schema.required).toContain('questionId');
    expect(schema.required).toContain('bullets');
  });
});

describe('interviewPrepTools', () => {
  it('contains only generate_interview_answer', () => {
    expect(interviewPrepTools).toHaveLength(1);
    expect(interviewPrepTools[0].name).toBe('generate_interview_answer');
  });

  it('is a subset of resumeTools', () => {
    const resumeToolNames = new Set(resumeTools.map((t) => t.name));
    for (const t of interviewPrepTools) {
      expect(resumeToolNames.has(t.name)).toBe(true);
    }
  });
});
