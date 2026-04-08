/**
 * Invisible Unicode characters that survive String.trim() but render as nothing
 * in the browser. Common in PDF text extraction (pdf.js) and copy-paste.
 */
const INVISIBLE_RE = /[\u200B-\u200D\u2060\uFEFF\u00AD\u200E\u200F\u2028\u2029]/g;

/** Returns true if the string contains at least one visible character. */
export function hasVisibleText(s: string): boolean {
  return s.replace(INVISIBLE_RE, '').trim().length > 0;
}
