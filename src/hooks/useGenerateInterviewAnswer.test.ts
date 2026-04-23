import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerateInterviewAnswer } from './useGenerateInterviewAnswer';
import { useAppStore } from '../stores/useAppStore';
import type { InterviewPrepQuestion } from '../constants/interviewPrepQuestions';

vi.mock('../services/anthropic', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../services/anthropic';

const mockGetClient = vi.mocked(getClient);

const stubQuestion: InterviewPrepQuestion = {
  id: 'tell-me-about-yourself',
  question: 'Tell me about yourself.',
  category: 'opener',
};

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

function makeMockStream(finalMsg: Record<string, unknown>) {
  return {
    finalMessage: vi.fn().mockResolvedValue(finalMsg),
  };
}

function makeToolUseMessage(input: Record<string, unknown>, toolId = 'tu1') {
  return {
    stop_reason: 'tool_use',
    content: [
      {
        type: 'tool_use',
        id: toolId,
        name: 'generate_interview_answer',
        input,
      },
    ],
  };
}

function makeEndTurnMessage(text = 'Done') {
  return {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setStoreState();
});

describe('useGenerateInterviewAnswer', () => {
  it('sets error when no API key is configured', async () => {
    setStoreState({ apiKey: '' });
    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));

    await act(() => result.current.generate());

    expect(result.current.error).toBe(
      'No API key configured. Add your Anthropic API key in Settings.',
    );
  });

  it('calls API with correct model, tools and cached pool block', async () => {
    const mockStream = makeMockStream(makeEndTurnMessage());
    const mockClient = { messages: { stream: vi.fn().mockReturnValue(mockStream) } };
    mockGetClient.mockReturnValue(mockClient as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    expect(mockClient.messages.stream).toHaveBeenCalledOnce();
    const args = mockClient.messages.stream.mock.calls[0][0];
    expect(args.model).toBe('claude-sonnet-4-20250514');
    expect(args.max_tokens).toBe(2048);
    expect(args.tools).toBeDefined();
    expect(args.tools).toHaveLength(1);
    expect(args.tools[0].name).toBe('generate_interview_answer');

    // Pool JSON is in user message content block #0, with ephemeral cache_control
    const userMsg = args.messages[0];
    expect(userMsg.role).toBe('user');
    expect(userMsg.content[0].type).toBe('text');
    expect(userMsg.content[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(userMsg.content[0].text).toContain('Content Pool');
    // Question text is in block #1 (not cached)
    expect(userMsg.content[1].cache_control).toBeUndefined();
    expect(userMsg.content[1].text).toContain(stubQuestion.id);
  });

  it('stores bullets when AI calls generate_interview_answer tool', async () => {
    const updateInterviewPrepAnswer = vi.fn();
    setStoreState({ updateInterviewPrepAnswer });

    const toolMsg = makeToolUseMessage({
      questionId: 'tell-me-about-yourself',
      bullets: ['I am a software engineer.', 'I love shipping products.'],
    });
    const endMsg = makeEndTurnMessage();

    const mockClient = {
      messages: {
        stream: vi.fn()
          .mockReturnValueOnce(makeMockStream(toolMsg))
          .mockReturnValueOnce(makeMockStream(endMsg)),
      },
    };
    mockGetClient.mockReturnValue(mockClient as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    expect(updateInterviewPrepAnswer).toHaveBeenCalledOnce();
    expect(updateInterviewPrepAnswer).toHaveBeenCalledWith(
      'tell-me-about-yourself',
      ['I am a software engineer.', 'I love shipping products.'],
    );
    expect(result.current.error).toBeNull();
  });

  it('sets error if AI returns no tool call (silent-fail guard)', async () => {
    const endMsg = makeEndTurnMessage('Here are your bullets...');
    mockGetClient.mockReturnValue({
      messages: { stream: vi.fn().mockReturnValue(makeMockStream(endMsg)) },
    } as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    expect(result.current.error).toBe("AI didn't produce an answer — try again.");
  });

  it('sets error if AI returns empty bullets array', async () => {
    const updateInterviewPrepAnswer = vi.fn();
    setStoreState({ updateInterviewPrepAnswer });

    const toolMsg = makeToolUseMessage({
      questionId: stubQuestion.id,
      bullets: [],
    });
    const endMsg = makeEndTurnMessage();

    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn()
          .mockReturnValueOnce(makeMockStream(toolMsg))
          .mockReturnValueOnce(makeMockStream(endMsg)),
      },
    } as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    expect(updateInterviewPrepAnswer).not.toHaveBeenCalled();
    // Post-loop fallback overwrites since generated=false
    expect(result.current.error).toBe("AI didn't produce an answer — try again.");
  });

  it('handles 401 error', async () => {
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation(() => {
          throw new Error('Request failed with status code 401');
        }),
      },
    } as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    expect(result.current.error).toBe('Invalid API key. Check Settings.');
  });

  it('handles 429 error', async () => {
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation(() => {
          throw new Error('Request failed with status code 429');
        }),
      },
    } as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    expect(result.current.error).toBe('Rate limited. Wait a moment and try again.');
  });

  it('abort stops generation cleanly', async () => {
    let resolveStream: (v: unknown) => void;
    const pendingStream = new Promise((resolve) => {
      resolveStream = resolve;
    });

    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockReturnValue({
          finalMessage: vi.fn().mockReturnValue(pendingStream),
        }),
      },
    } as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));

    let generatePromise: Promise<void>;
    act(() => {
      generatePromise = result.current.generate();
    });

    act(() => {
      result.current.abort();
    });

    resolveStream!(makeEndTurnMessage());
    await act(() => generatePromise!);

    expect(result.current.error).toBeNull();
    expect(result.current.isGenerating).toBe(false);
  });

  it('sign-out mid-generation guard: drops result if userId changed', async () => {
    const updateInterviewPrepAnswer = vi.fn();
    setStoreState({ userId: 'user-A', updateInterviewPrepAnswer });

    const toolMsg = makeToolUseMessage({
      questionId: stubQuestion.id,
      bullets: ['bullet one', 'bullet two'],
    });
    const endMsg = makeEndTurnMessage();

    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn()
          .mockReturnValueOnce({
            finalMessage: vi.fn().mockImplementation(async () => {
              // Simulate sign-out mid-generation by changing userId before callback fires.
              useAppStore.setState({ userId: 'user-B' } as never);
              return toolMsg;
            }),
          })
          .mockReturnValueOnce(makeMockStream(endMsg)),
      },
    } as never);

    const { result } = renderHook(() => useGenerateInterviewAnswer(stubQuestion));
    await act(() => result.current.generate());

    // Drop the result — do not write to a different user's store.
    expect(updateInterviewPrepAnswer).not.toHaveBeenCalled();
  });
});
