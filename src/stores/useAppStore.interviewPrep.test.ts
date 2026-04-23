import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

// Mock persistence router so we can spy on saveInterviewPrep without touching IDB.
vi.mock('../db/persistence', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../db/persistence');
  return {
    ...actual,
    saveInterviewPrep: vi.fn(),
  };
});

import { saveInterviewPrep } from '../db/persistence';

const mockSave = vi.mocked(saveInterviewPrep);

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    interviewPrep: null,
    userId: null,
  } as never);
});

describe('useAppStore — interview prep actions', () => {
  it('updateInterviewPrepAnswer creates new record when none exists', () => {
    expect(useAppStore.getState().interviewPrep).toBeNull();

    useAppStore.getState().updateInterviewPrepAnswer('q1', ['a', 'b', 'c']);

    const prep = useAppStore.getState().interviewPrep;
    expect(prep).not.toBeNull();
    expect(prep?.id).toBe('default');
    expect(prep?.answers.q1).toEqual(['a', 'b', 'c']);
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('updateInterviewPrepAnswer updates existing record without clobbering other answers', () => {
    useAppStore.setState({
      interviewPrep: {
        id: 'default',
        answers: { existingQ: ['prev'] },
        updatedAt: '2024-01-01T00:00:00Z',
      },
    } as never);

    useAppStore.getState().updateInterviewPrepAnswer('newQ', ['fresh']);

    const prep = useAppStore.getState().interviewPrep!;
    expect(prep.answers.existingQ).toEqual(['prev']);
    expect(prep.answers.newQ).toEqual(['fresh']);
  });

  it('updateInterviewPrepAnswer overwrites bullets for same questionId', () => {
    useAppStore.getState().updateInterviewPrepAnswer('q1', ['original']);
    useAppStore.getState().updateInterviewPrepAnswer('q1', ['replaced']);

    expect(useAppStore.getState().interviewPrep?.answers.q1).toEqual(['replaced']);
  });

  it('clearInterviewPrepAnswer removes a single questionId', () => {
    useAppStore.setState({
      interviewPrep: {
        id: 'default',
        answers: { a: ['x'], b: ['y'] },
        updatedAt: '2024',
      },
    } as never);

    useAppStore.getState().clearInterviewPrepAnswer('a');

    const prep = useAppStore.getState().interviewPrep!;
    expect(prep.answers.a).toBeUndefined();
    expect(prep.answers.b).toEqual(['y']);
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('clearInterviewPrepAnswer is a no-op if prep is null', () => {
    expect(useAppStore.getState().interviewPrep).toBeNull();
    useAppStore.getState().clearInterviewPrepAnswer('whatever');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('clearAllInterviewPrepAnswers wipes every answer', () => {
    useAppStore.setState({
      interviewPrep: {
        id: 'default',
        answers: { a: ['x'], b: ['y'], c: ['z'] },
        updatedAt: '2024',
      },
    } as never);

    useAppStore.getState().clearAllInterviewPrepAnswers();

    const prep = useAppStore.getState().interviewPrep!;
    expect(prep.answers).toEqual({});
    expect(prep.id).toBe('default');
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('persists with userId=null (IDB path) when no user is signed in', () => {
    useAppStore.getState().updateInterviewPrepAnswer('q1', ['a']);
    expect(mockSave).toHaveBeenCalledWith(null, expect.objectContaining({ id: 'default' }));
  });

  it('persists with userId when signed in (Firestore path)', () => {
    useAppStore.setState({ userId: 'user-abc' } as never);
    useAppStore.getState().updateInterviewPrepAnswer('q1', ['a']);
    expect(mockSave).toHaveBeenCalledWith('user-abc', expect.objectContaining({ id: 'default' }));
  });
});
