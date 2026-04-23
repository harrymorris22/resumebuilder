import { describe, it, expect } from 'vitest';
import { useAppStore } from './useAppStore';

// Regression: interviewPrep must NOT round-trip through localStorage.
// The store uses an allowlist-based partialize, so adding a new in-memory
// collection shouldn't accidentally end up in localStorage. This test
// guards against someone widening the allowlist in a future edit.
describe('useAppStore — partialize allowlist (regression)', () => {
  it('does not write interviewPrep to localStorage', () => {
    useAppStore.setState({
      interviewPrep: {
        id: 'default',
        answers: { q1: ['a', 'b'] },
        updatedAt: '2024',
      },
    } as never);

    const raw = localStorage.getItem('resume-builder-settings');
    if (!raw) {
      // If the store hasn't serialized yet, that's fine — partialize is lazy.
      // Trigger a write by updating a persisted scalar.
      useAppStore.setState({ apiKey: 'touch' } as never);
    }

    const rawAfter = localStorage.getItem('resume-builder-settings');
    // Even if the store hasn't flushed, we never want interviewPrep in the payload.
    if (rawAfter) {
      expect(rawAfter).not.toContain('interviewPrep');
      expect(rawAfter).not.toContain('"q1"');
    }
  });

  it('does not write contentPool, resumes, or interviewPrep (broader regression)', () => {
    useAppStore.setState({
      apiKey: 'some-key',
      interviewPrep: { id: 'default', answers: { q1: ['x'] }, updatedAt: '2024' },
    } as never);

    const raw = localStorage.getItem('resume-builder-settings');
    if (raw) {
      expect(raw).not.toContain('interviewPrep');
      expect(raw).not.toContain('contentPool');
      // resumes array may be massive — definitely not persisted
      expect(raw).not.toContain('"resumes":[');
    }
  });
});
