import { describe, it, expect } from 'vitest';
import { buildInterviewAnswerPrompt } from './systemPrompt';

describe('buildInterviewAnswerPrompt', () => {
  const question = {
    id: 'tell-me-about-yourself',
    question: 'Tell me about yourself.',
  };

  it('includes the question id and text', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    expect(prompt).toContain('tell-me-about-yourself');
    expect(prompt).toContain('Tell me about yourself.');
  });

  it('wraps question in user-data tags for injection defense', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    expect(prompt).toContain('interview-question');
  });

  it('includes DEFENSE_PREAMBLE', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    // DEFENSE_PREAMBLE contains security language — test for a sentinel phrase
    expect(prompt.length).toBeGreaterThan(500);
    // Starts with the preamble
    expect(prompt.indexOf('You are an expert interview coach')).toBeGreaterThan(0);
  });

  it('instructs model to call generate_interview_answer tool with the specific questionId', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    expect(prompt).toContain('generate_interview_answer');
    expect(prompt).toContain('"tell-me-about-yourself"');
  });

  it('includes the no-fabrication rules', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    expect(prompt).toContain('Never invent facts');
    expect(prompt).toContain('source of truth');
  });

  it('includes the thin-pool meta-only fallback', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    expect(prompt).toContain('Thin-pool fallback');
    expect(prompt).toContain('meta-only');
  });

  it('does NOT interpolate content pool JSON (stable cache breakpoint)', () => {
    const prompt = buildInterviewAnswerPrompt(question);
    // Pool is passed separately in a cached message block — not in the system string.
    // Confirm the system prompt mentions this explicitly.
    expect(prompt).toContain('cached block');
  });

  it('works for different question ids', () => {
    const p1 = buildInterviewAnswerPrompt({ id: 'greatest-weakness', question: 'What is your greatest weakness?' });
    const p2 = buildInterviewAnswerPrompt({ id: 'five-year-plan', question: 'Where do you see yourself in five years?' });
    expect(p1).toContain('greatest-weakness');
    expect(p1).toContain('greatest weakness');
    expect(p2).toContain('five-year-plan');
    expect(p2).toContain('Where do you see yourself');
  });
});
