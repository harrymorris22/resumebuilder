import { describe, it, expect } from 'vitest';
import { hasVisibleText } from './textClean';

describe('hasVisibleText', () => {
  it('returns false for empty string', () => {
    expect(hasVisibleText('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(hasVisibleText('   ')).toBe(false);
    expect(hasVisibleText('\t\n')).toBe(false);
  });

  it('returns false for zero-width space only', () => {
    expect(hasVisibleText('\u200B')).toBe(false);
  });

  it('returns false for zero-width non-joiner only', () => {
    expect(hasVisibleText('\u200C')).toBe(false);
  });

  it('returns false for zero-width joiner only', () => {
    expect(hasVisibleText('\u200D')).toBe(false);
  });

  it('returns false for word joiner only', () => {
    expect(hasVisibleText('\u2060')).toBe(false);
  });

  it('returns false for BOM only', () => {
    expect(hasVisibleText('\uFEFF')).toBe(false);
  });

  it('returns false for soft hyphen only', () => {
    expect(hasVisibleText('\u00AD')).toBe(false);
  });

  it('returns false for mixed invisible characters', () => {
    expect(hasVisibleText('\u200B \t \u200D\uFEFF')).toBe(false);
  });

  it('returns true for normal text', () => {
    expect(hasVisibleText('hello')).toBe(true);
  });

  it('returns true for text with leading/trailing whitespace', () => {
    expect(hasVisibleText('  hello  ')).toBe(true);
  });

  it('returns true for text mixed with invisible chars', () => {
    expect(hasVisibleText('\u200Bhello\u200B')).toBe(true);
  });

  it('returns true for single visible character', () => {
    expect(hasVisibleText('a')).toBe(true);
  });
});
