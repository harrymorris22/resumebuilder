import { describe, it, expect } from 'vitest';
import { INTERVIEW_PREP_QUESTIONS, type InterviewPrepCategory } from './interviewPrepQuestions';

const VALID_CATEGORIES: InterviewPrepCategory[] = [
  'opener',
  'behavioural',
  'strengths-weaknesses',
  'motivation',
];

describe('INTERVIEW_PREP_QUESTIONS', () => {
  it('has 12 questions', () => {
    expect(INTERVIEW_PREP_QUESTIONS).toHaveLength(12);
  });

  it('all ids are unique', () => {
    const ids = INTERVIEW_PREP_QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all ids are non-empty kebab-case slugs', () => {
    for (const q of INTERVIEW_PREP_QUESTIONS) {
      expect(q.id).toMatch(/^[a-z][a-z0-9-]*[a-z0-9]$/);
    }
  });

  it('all questions are non-empty strings', () => {
    for (const q of INTERVIEW_PREP_QUESTIONS) {
      expect(q.question.length).toBeGreaterThan(5);
    }
  });

  it('all categories are valid', () => {
    for (const q of INTERVIEW_PREP_QUESTIONS) {
      expect(VALID_CATEGORIES).toContain(q.category);
    }
  });

  it('contains expected common questions', () => {
    const ids = INTERVIEW_PREP_QUESTIONS.map((q) => q.id);
    expect(ids).toContain('tell-me-about-yourself');
    expect(ids).toContain('greatest-strength');
    expect(ids).toContain('greatest-weakness');
    expect(ids).toContain('five-year-plan');
  });

  it('has at least one opener', () => {
    const openers = INTERVIEW_PREP_QUESTIONS.filter((q) => q.category === 'opener');
    expect(openers.length).toBeGreaterThanOrEqual(1);
  });

  it('contains no role-specific or company-specific questions', () => {
    // Interview Prep lives in the header (CV/job agnostic), so questions that
    // presuppose a specific target role or company must not appear here.
    for (const q of INTERVIEW_PREP_QUESTIONS) {
      expect(q.question).not.toMatch(/this role/i);
      expect(q.question).not.toMatch(/why should we hire/i);
    }
  });
});
