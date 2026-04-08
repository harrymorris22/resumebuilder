import { describe, it, expect } from 'vitest';
import { hasVisibleText, formatEndDate } from './textClean';

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

describe('hasVisibleText with PDF-extracted strings', () => {
  // Patterns that pdf.js actually produces during text extraction
  const PDF_GARBAGE_STRINGS = [
    '\u200B',
    '\u200B \u200B',
    '\uFEFF',
    '\u200B\u200C\u200D\u2060',
    ' \u200B \t \uFEFF ',
    '\u00AD',
    '\u200E\u200F',
    '\u2028',
    '\u2029',
  ];

  it.each(PDF_GARBAGE_STRINGS)(
    'rejects PDF garbage string: %j',
    (s) => {
      expect(hasVisibleText(s)).toBe(false);
    }
  );

  const PDF_DIRTY_BUT_VISIBLE = [
    '\u200BManaged a team of 5 engineers\u200B',
    '\uFEFFDesigned REST APIs',
    'Led \u200Bmigration\u200B to AWS',
    '\u00ADReduced latency by 40%\u00AD',
  ];

  it.each(PDF_DIRTY_BUT_VISIBLE)(
    'accepts dirty-but-visible string: %j',
    (s) => {
      expect(hasVisibleText(s)).toBe(true);
    }
  );
});

describe('formatEndDate', () => {
  it('returns "Present" for null', () => {
    expect(formatEndDate(null)).toBe('Present');
  });

  it('returns "Present" for undefined', () => {
    expect(formatEndDate(undefined)).toBe('Present');
  });

  it('returns "Present" for empty string', () => {
    expect(formatEndDate('')).toBe('Present');
  });

  it('returns "Present" for literal string "null"', () => {
    expect(formatEndDate('null')).toBe('Present');
  });

  it('returns the date string when valid', () => {
    expect(formatEndDate('Dec 2019')).toBe('Dec 2019');
  });

  it('returns "Present" string as-is', () => {
    expect(formatEndDate('Present')).toBe('Present');
  });
});
