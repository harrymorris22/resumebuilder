import { describe, it, expect } from 'vitest';
import { isSectionEmpty } from './sectionEmpty';
import type { SectionContent } from '../types/resume';

describe('isSectionEmpty', () => {
  it('returns false for contact sections', () => {
    const content: SectionContent = {
      type: 'contact',
      data: { fullName: '', email: '', phone: '', location: '' },
    };
    expect(isSectionEmpty(content)).toBe(false);
  });

  it('returns true for empty summary', () => {
    expect(isSectionEmpty({ type: 'summary', data: { text: '' } })).toBe(true);
    expect(isSectionEmpty({ type: 'summary', data: { text: '  ' } })).toBe(true);
  });

  it('returns false for non-empty summary', () => {
    expect(isSectionEmpty({ type: 'summary', data: { text: 'Hello' } })).toBe(false);
  });

  it('returns true for empty items arrays', () => {
    expect(isSectionEmpty({ type: 'experience', data: { items: [] } })).toBe(true);
    expect(isSectionEmpty({ type: 'education', data: { items: [] } })).toBe(true);
    expect(isSectionEmpty({ type: 'projects', data: { items: [] } })).toBe(true);
    expect(isSectionEmpty({ type: 'certifications', data: { items: [] } })).toBe(true);
    expect(isSectionEmpty({ type: 'custom', data: { heading: 'Test', items: [] } })).toBe(true);
  });

  it('returns false for non-empty items arrays', () => {
    expect(isSectionEmpty({
      type: 'experience',
      data: { items: [{ id: '1', company: 'Co', title: 'Dev', location: '', dateRange: { start: '2020', end: null }, bullets: [] }] },
    })).toBe(false);
  });

  it('returns true for empty skills categories', () => {
    expect(isSectionEmpty({ type: 'skills', data: { categories: [] } })).toBe(true);
  });

  it('returns false for non-empty skills categories', () => {
    expect(isSectionEmpty({
      type: 'skills',
      data: { categories: [{ id: '1', name: 'Languages', skills: ['JS'] }] },
    })).toBe(false);
  });
});
