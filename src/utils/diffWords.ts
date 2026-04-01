export interface DiffSegment {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

/**
 * Word-level diff using LCS (longest common subsequence).
 * Returns segments marking equal, added, and removed words.
 */
export function diffWords(oldText: string, newText: string): DiffSegment[] {
  if (oldText === newText) {
    return oldText ? [{ type: 'equal', text: oldText }] : [];
  }
  if (!oldText) {
    return [{ type: 'added', text: newText }];
  }
  if (!newText) {
    return [{ type: 'removed', text: oldText }];
  }

  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);
  const m = oldWords.length;
  const n = newWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldWords[i - 1] === newWords[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to get diff segments
  const rawSegments: DiffSegment[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      rawSegments.push({ type: 'equal', text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawSegments.push({ type: 'added', text: newWords[j - 1] });
      j--;
    } else {
      rawSegments.push({ type: 'removed', text: oldWords[i - 1] });
      i--;
    }
  }

  rawSegments.reverse();

  // Merge consecutive segments of the same type
  const merged: DiffSegment[] = [];
  for (const seg of rawSegments) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) {
      last.text += ' ' + seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}
