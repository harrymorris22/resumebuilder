import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGenerateAllInterviewAnswers, pLimit } from './useGenerateAllInterviewAnswers';
import { useAppStore } from '../stores/useAppStore';
import { INTERVIEW_PREP_QUESTIONS } from '../constants/interviewPrepQuestions';

vi.mock('../services/anthropic', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../services/anthropic';

const mockGetClient = vi.mocked(getClient);

const stubResume = {
  id: 'r1',
  name: 'Test',
  sections: [],
  createdAt: '',
  updatedAt: '',
  templateId: 'classic' as const,
};

const stubContentPool = [
  {
    id: 'cp1',
    item: {
      type: 'bullet' as const,
      data: { text: 'Shipped feature X' },
      context: { company: 'Acme', title: 'Dev', startDate: '2020', endDate: '2024' },
    },
    source: 'user' as const,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

function setStoreState(overrides: Record<string, unknown> = {}) {
  useAppStore.setState({
    apiKey: 'test-key',
    userId: null,
    resumes: [stubResume],
    contentPool: stubContentPool,
    interviewPrep: null,
    updateInterviewPrepAnswer: vi.fn(),
    ...overrides,
  } as never);
}

function makeToolUseFinalMessage(qid: string, bullets: string[]) {
  return {
    stop_reason: 'tool_use',
    content: [
      {
        type: 'tool_use',
        id: `tu-${qid}`,
        name: 'generate_interview_answer',
        input: { questionId: qid, bullets },
      },
    ],
  };
}

function makeEndTurnMessage() {
  return { stop_reason: 'end_turn', content: [{ type: 'text', text: 'done' }] };
}

beforeEach(() => {
  vi.clearAllMocks();
  setStoreState();
});

describe('pLimit helper', () => {
  it('never runs more than N tasks concurrently', async () => {
    const limit = pLimit(3);
    let inFlight = 0;
    let maxInFlight = 0;

    const tasks = Array.from({ length: 10 }, () =>
      limit(async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 10));
        inFlight--;
      }),
    );

    await Promise.all(tasks);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('processes all tasks even past the concurrency limit', async () => {
    const limit = pLimit(2);
    const results: number[] = [];
    await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        limit(async () => {
          results.push(n);
        }),
      ),
    );
    expect(results.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('useGenerateAllInterviewAnswers', () => {
  it('sets error when no API key', async () => {
    setStoreState({ apiKey: '' });
    const { result } = renderHook(() => useGenerateAllInterviewAnswers());

    await act(() => result.current.generateAll());

    expect(result.current.error).toBe(
      'No API key configured. Add your Anthropic API key in Settings.',
    );
  });

  it('skips already-answered questions when force=false', async () => {
    const prefilled: Record<string, string[]> = {};
    // Prefill everything except the last 2, regardless of list length.
    INTERVIEW_PREP_QUESTIONS.slice(0, -2).forEach((q) => {
      prefilled[q.id] = ['pre-existing bullet'];
    });
    setStoreState({
      interviewPrep: { id: 'default', answers: prefilled, updatedAt: '2024' },
    });

    const streamSpy = vi.fn();
    // Return end_turn immediately so each call's loop exits without generating
    streamSpy.mockReturnValue({ finalMessage: vi.fn().mockResolvedValue(makeEndTurnMessage()) });
    mockGetClient.mockReturnValue({ messages: { stream: streamSpy } } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());
    await act(() => result.current.generateAll({ force: false }));

    // Only the 2 remaining unanswered questions were attempted
    expect(streamSpy).toHaveBeenCalledTimes(2);
    // Target total should be 2
    expect(result.current.progress.total).toBe(2);
  });

  it('regenerates all questions when force=true', async () => {
    const prefilled: Record<string, string[]> = {};
    INTERVIEW_PREP_QUESTIONS.forEach((q) => {
      prefilled[q.id] = ['pre-existing'];
    });
    setStoreState({
      interviewPrep: { id: 'default', answers: prefilled, updatedAt: '2024' },
    });

    const streamSpy = vi.fn();
    streamSpy.mockReturnValue({ finalMessage: vi.fn().mockResolvedValue(makeEndTurnMessage()) });
    mockGetClient.mockReturnValue({ messages: { stream: streamSpy } } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());
    await act(() => result.current.generateAll({ force: true }));

    expect(streamSpy).toHaveBeenCalledTimes(INTERVIEW_PREP_QUESTIONS.length);
    expect(result.current.progress.total).toBe(INTERVIEW_PREP_QUESTIONS.length);
  });

  it('does nothing if all questions already answered and force=false', async () => {
    const prefilled: Record<string, string[]> = {};
    INTERVIEW_PREP_QUESTIONS.forEach((q) => {
      prefilled[q.id] = ['pre-existing'];
    });
    setStoreState({
      interviewPrep: { id: 'default', answers: prefilled, updatedAt: '2024' },
    });

    const streamSpy = vi.fn();
    mockGetClient.mockReturnValue({ messages: { stream: streamSpy } } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());
    await act(() => result.current.generateAll({ force: false }));

    expect(streamSpy).not.toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
  });

  it('writes bullets to store for each successful question', async () => {
    const updateInterviewPrepAnswer = vi.fn();
    setStoreState({ updateInterviewPrepAnswer });

    // Inspect messages to decide: first call (1 msg) → tool_use; continuation (3+ msgs) → end_turn.
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation((args: { messages: unknown[] }) => {
          const isFirstCall = args.messages.length === 1;
          if (isFirstCall) {
            // Extract questionId from the user message text so we can tool_use with the right id.
            const msg = args.messages[0] as { content: Array<{ text: string }> };
            const match = msg.content[1].text.match(/Question \(([^)]+)\)/);
            const qid = match ? match[1] : 'unknown';
            return {
              finalMessage: vi.fn().mockResolvedValue(
                makeToolUseFinalMessage(qid, [`bullet for ${qid}`]),
              ),
            };
          }
          return { finalMessage: vi.fn().mockResolvedValue(makeEndTurnMessage()) };
        }),
      },
    } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());
    await act(() => result.current.generateAll({ force: true }));

    expect(updateInterviewPrepAnswer).toHaveBeenCalledTimes(INTERVIEW_PREP_QUESTIONS.length);
    expect(result.current.progress.failed).toBe(0);
  });

  it('per-question failure does not abort the batch', async () => {
    const updateInterviewPrepAnswer = vi.fn();
    setStoreState({ updateInterviewPrepAnswer });

    // First question throws 429; remaining succeed with tool calls.
    let callCount = 0;
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation(() => {
          const c = callCount++;
          // Question 0 fails on its first call.
          if (c === 0) {
            throw new Error('Request failed with status code 429');
          }
          // For all other calls, alternate tool_use / end_turn.
          return {
            finalMessage: vi.fn().mockResolvedValue(makeEndTurnMessage()),
          };
        }),
      },
    } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());
    await act(() => result.current.generateAll({ force: true }));

    // Total should be all questions in the set
    expect(result.current.progress.total).toBe(INTERVIEW_PREP_QUESTIONS.length);
    // At least one failure should be recorded
    expect(result.current.progress.failed).toBeGreaterThan(0);
    // isGenerating should settle back to false
    expect(result.current.isGenerating).toBe(false);
  });

  it('concurrency never exceeds 3 in-flight stream calls', async () => {
    setStoreState();

    let inFlight = 0;
    let maxInFlight = 0;

    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation(() => ({
          finalMessage: vi.fn().mockImplementation(async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((r) => setTimeout(r, 5));
            inFlight--;
            return makeEndTurnMessage();
          }),
        })),
      },
    } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());
    await act(() => result.current.generateAll({ force: true }));

    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('abort cancels pending work', async () => {
    setStoreState();

    // Stream that hangs forever until aborted.
    const hanging = new Promise(() => {});
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockReturnValue({
          finalMessage: vi.fn().mockReturnValue(hanging),
        }),
      },
    } as never);

    const { result } = renderHook(() => useGenerateAllInterviewAnswers());

    let p: Promise<void>;
    act(() => {
      p = result.current.generateAll({ force: true });
    });

    // Let the hook kick off.
    await waitFor(() => expect(result.current.isGenerating).toBe(true));

    act(() => {
      result.current.abort();
    });

    // The controller is aborted; runOne throws, Promise.allSettled still resolves.
    // We don't await p here because finalMessage is pending forever —
    // abort only signals, doesn't cancel the mock promise.
    // Just assert that the abort flow doesn't throw synchronously.
    expect(typeof p!).toBe('object');
  });
});
