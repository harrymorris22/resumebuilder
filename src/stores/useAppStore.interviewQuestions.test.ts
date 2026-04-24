import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { InterviewQuestions } from '../types/resume';

// Mock persistence router so we can spy on saveInterviewQuestions / deleteInterviewQuestions
// without touching IDB.
vi.mock('../db/persistence', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../db/persistence');
  return {
    ...actual,
    saveInterviewQuestions: vi.fn(),
    deleteInterviewQuestions: vi.fn(),
    // Stubbed getters used by hydrateFromIdb — return empty arrays/undefined
    // so the hydration path runs without real IDB.
    getAllResumes: vi.fn().mockResolvedValue([]),
    getAllChatSessions: vi.fn().mockResolvedValue([]),
    getAllContentBankItems: vi.fn().mockResolvedValue([]),
    getAllContentPoolEntries: vi.fn().mockResolvedValue([]),
    getAllJobDescriptions: vi.fn().mockResolvedValue([]),
    getAllRecommendations: vi.fn().mockResolvedValue([]),
    getAllInterviewQuestions: vi.fn().mockResolvedValue([]),
    getInterviewPrep: vi.fn().mockResolvedValue(undefined),
    saveResume: vi.fn(),
    saveChatSession: vi.fn(),
  };
});

import {
  saveInterviewQuestions,
  deleteInterviewQuestions,
  getAllInterviewQuestions,
} from '../db/persistence';

const mockSave = vi.mocked(saveInterviewQuestions);
const mockDelete = vi.mocked(deleteInterviewQuestions);
const mockGetAll = vi.mocked(getAllInterviewQuestions);

function makeIq(overrides: Partial<InterviewQuestions> = {}): InterviewQuestions {
  return {
    id: 'iq-1',
    resumeId: 'resume-1',
    jobDescriptionId: 'jd-A',
    questions: ['q1', 'q2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    interviewQuestions: [],
    userId: null,
    activeJobDescriptionId: null,
    generatedResumeId: null,
  } as never);
});

describe('useAppStore — addInterviewQuestions upsert by (resumeId, jobDescriptionId)', () => {
  it('appends when no existing entry for the (resume, JD) pair', () => {
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-1', resumeId: 'R1', jobDescriptionId: 'jd-A' }),
    );
    expect(useAppStore.getState().interviewQuestions).toHaveLength(1);
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('replaces existing entry for the same (resume, JD) pair (regen case) — no duplicates', () => {
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-1', resumeId: 'R1', jobDescriptionId: 'jd-A', questions: ['old1', 'old2'] }),
    );
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-2', resumeId: 'R1', jobDescriptionId: 'jd-A', questions: ['new1', 'new2'] }),
    );

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(1);
    expect(list[0].questions).toEqual(['new1', 'new2']);
  });

  it('reuses the existing id on upsert so persistence layer overwrites cleanly', () => {
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'existing-stable-id', resumeId: 'R1', jobDescriptionId: 'jd-A' }),
    );
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'new-random-id', resumeId: 'R1', jobDescriptionId: 'jd-A', questions: ['regenerated'] }),
    );

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('existing-stable-id');
    const lastCall = mockSave.mock.calls[mockSave.mock.calls.length - 1];
    expect((lastCall[1] as InterviewQuestions).id).toBe('existing-stable-id');
  });

  it('keeps entries for other JDs intact when upserting', () => {
    useAppStore.getState().addInterviewQuestions(makeIq({ id: 'iq-A', resumeId: 'R1', jobDescriptionId: 'jd-A' }));
    useAppStore.getState().addInterviewQuestions(makeIq({ id: 'iq-B', resumeId: 'R1', jobDescriptionId: 'jd-B' }));
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-A2', resumeId: 'R1', jobDescriptionId: 'jd-A', questions: ['new'] }),
    );

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(2);
    expect(list.find((x) => x.jobDescriptionId === 'jd-A')?.questions).toEqual(['new']);
    expect(list.find((x) => x.jobDescriptionId === 'jd-B')?.questions).toEqual(['q1', 'q2']);
  });

  it('keeps entries for other resumes intact when upserting (no cross-resume clobber)', () => {
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-R1', resumeId: 'R1', jobDescriptionId: 'jd-A', questions: ['r1-q1'] }),
    );
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-R2', resumeId: 'R2', jobDescriptionId: 'jd-A', questions: ['r2-q1'] }),
    );
    // Regenerate for R1 — must not touch R2's entry even though they share JD.
    useAppStore.getState().addInterviewQuestions(
      makeIq({ id: 'iq-R1-new', resumeId: 'R1', jobDescriptionId: 'jd-A', questions: ['r1-q1-new'] }),
    );

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(2);
    const r1 = list.find((x) => x.resumeId === 'R1' && x.jobDescriptionId === 'jd-A');
    const r2 = list.find((x) => x.resumeId === 'R2' && x.jobDescriptionId === 'jd-A');
    expect(r1?.questions).toEqual(['r1-q1-new']);
    expect(r2?.questions).toEqual(['r2-q1']);
  });
});

describe('useAppStore — no mirrored activeInterviewQuestions state', () => {
  it('does not expose an activeInterviewQuestions field (derive from list + activeJobDescriptionId + generatedResumeId)', () => {
    const state = useAppStore.getState() as unknown as Record<string, unknown>;
    expect(state.activeInterviewQuestions).toBeUndefined();
    expect(state.setActiveInterviewQuestions).toBeUndefined();
  });
});

describe('useAppStore — hydrateFromIdb interview questions migration', () => {
  it('drops legacy rows without resumeId and deletes them from persistence', async () => {
    mockGetAll.mockResolvedValueOnce([
      // Legacy row — no resumeId. Must be dropped + deleted.
      { id: 'legacy-1', jobDescriptionId: 'jd-A', questions: ['old'], createdAt: '2024-01-01T00:00:00.000Z' } as unknown as InterviewQuestions,
      // Valid row — kept.
      makeIq({ id: 'valid-1', resumeId: 'R1', jobDescriptionId: 'jd-B' }),
    ]);

    await useAppStore.getState().hydrateFromIdb(null);

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('valid-1');
    expect(mockDelete).toHaveBeenCalledWith(null, 'legacy-1');
  });

  it('deduplicates by (resumeId, jobDescriptionId), keeping newest by createdAt', async () => {
    mockGetAll.mockResolvedValueOnce([
      makeIq({
        id: 'old',
        resumeId: 'R1',
        jobDescriptionId: 'jd-A',
        questions: ['old'],
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
      makeIq({
        id: 'new',
        resumeId: 'R1',
        jobDescriptionId: 'jd-A',
        questions: ['new'],
        createdAt: '2024-06-01T00:00:00.000Z',
      }),
    ]);

    await useAppStore.getState().hydrateFromIdb(null);

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('new');
    expect(list[0].questions).toEqual(['new']);
    expect(mockDelete).toHaveBeenCalledWith(null, 'old');
  });

  it('keeps distinct (resumeId, jobDescriptionId) pairs as separate rows', async () => {
    mockGetAll.mockResolvedValueOnce([
      makeIq({ id: 'r1-jdA', resumeId: 'R1', jobDescriptionId: 'jd-A' }),
      makeIq({ id: 'r2-jdA', resumeId: 'R2', jobDescriptionId: 'jd-A' }),
      makeIq({ id: 'r1-jdB', resumeId: 'R1', jobDescriptionId: 'jd-B' }),
    ]);

    await useAppStore.getState().hydrateFromIdb(null);

    const list = useAppStore.getState().interviewQuestions;
    expect(list).toHaveLength(3);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
