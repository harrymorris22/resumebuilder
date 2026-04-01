import { describe, it, expect } from 'vitest';
import { diffWords } from './diffWords';

describe('diffWords', () => {
  it('returns empty array for two empty strings', () => {
    expect(diffWords('', '')).toEqual([]);
  });

  it('returns equal segment for identical text', () => {
    expect(diffWords('hello world', 'hello world')).toEqual([
      { type: 'equal', text: 'hello world' },
    ]);
  });

  it('returns added segment when old is empty', () => {
    expect(diffWords('', 'new text')).toEqual([
      { type: 'added', text: 'new text' },
    ]);
  });

  it('returns removed segment when new is empty', () => {
    expect(diffWords('old text', '')).toEqual([
      { type: 'removed', text: 'old text' },
    ]);
  });

  it('detects word-level additions', () => {
    const result = diffWords('led team', 'led cross-functional team');
    expect(result).toContainEqual(expect.objectContaining({ type: 'added', text: 'cross-functional' }));
    expect(result).toContainEqual(expect.objectContaining({ type: 'equal', text: expect.stringContaining('led') }));
    expect(result).toContainEqual(expect.objectContaining({ type: 'equal', text: expect.stringContaining('team') }));
  });

  it('detects word-level removals', () => {
    const result = diffWords('managed large distributed team', 'managed team');
    const removedTexts = result.filter((s) => s.type === 'removed').map((s) => s.text).join(' ');
    expect(removedTexts).toContain('large');
    expect(removedTexts).toContain('distributed');
  });

  it('detects replacements (remove + add)', () => {
    const result = diffWords('built REST API', 'built GraphQL API');
    expect(result).toContainEqual(expect.objectContaining({ type: 'removed', text: 'REST' }));
    expect(result).toContainEqual(expect.objectContaining({ type: 'added', text: 'GraphQL' }));
    expect(result).toContainEqual(expect.objectContaining({ type: 'equal', text: expect.stringContaining('API') }));
  });

  it('merges consecutive segments of the same type', () => {
    const result = diffWords('a b c', 'x y z');
    // All old words removed, all new words added — should merge into one of each
    const removed = result.filter((s) => s.type === 'removed');
    const added = result.filter((s) => s.type === 'added');
    expect(removed.length).toBe(1);
    expect(added.length).toBe(1);
    expect(removed[0].text).toBe('a b c');
    expect(added[0].text).toBe('x y z');
  });
});
