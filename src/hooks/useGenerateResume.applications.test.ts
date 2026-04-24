import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerateResume } from './useGenerateResume';
import { useAppStore } from '../stores/useAppStore';
import type { JobDescription } from '../types/resume';

vi.mock('../services/anthropic', () => ({
  getClient: vi.fn(),
}));

vi.mock('../db/persistence', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../db/persistence');
  return {
    ...actual,
    saveApplication: vi.fn(),
    deleteApplication: vi.fn(),
    saveResume: vi.fn(),
    deleteResume: vi.fn(),
    saveContentBankItem: vi.fn(),
    saveContentPoolEntry: vi.fn(),
  };
});

import { getClient } from '../services/anthropic';

const mockGetClient = vi.mocked(getClient);

const stubJd: JobDescription = {
  id: 'jd1',
  title: 'Senior Engineer',
  company: 'Acme',
  rawText: 'We need a senior engineer',
  keywords: ['react'],
  createdAt: '2026-04-01T00:00:00.000Z',
};

const stubContentPool = [
  {
    id: 'cp1',
    item: {
      type: 'bullet' as const,
      data: { text: 'Built stuff' },
      context: { company: 'Co', title: 'Dev', startDate: '2020', endDate: '2024' },
    },
    source: 'user' as const,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
];

function seedStore(overrides: Record<string, unknown> = {}) {
  useAppStore.setState({
    apiKey: 'test-key',
    activeJobDescriptionId: 'jd1',
    jobDescriptions: [stubJd],
    contentPool: stubContentPool,
    resumes: [],
    applications: [],
    ...overrides,
  } as never);
}

function mockEndTurnClient() {
  const finalMessage = { content: [], stop_reason: 'end_turn' };
  const stream = { finalMessage: vi.fn().mockResolvedValue(finalMessage) };
  const client = { messages: { stream: vi.fn().mockReturnValue(stream) } };
  mockGetClient.mockReturnValue(client as never);
}

describe('useGenerateResume — auto-create application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      apiKey: null,
      resumes: [],
      applications: [],
      jobDescriptions: [],
      contentPool: [],
      activeJobDescriptionId: null,
    } as never);
  });

  it('generating a resume with a JD creates exactly one draft application', async () => {
    seedStore();
    mockEndTurnClient();
    const { result } = renderHook(() => useGenerateResume());
    await act(async () => {
      await result.current.generate();
    });
    const apps = useAppStore.getState().applications;
    expect(apps).toHaveLength(1);
    const app = apps[0];
    expect(app.status).toBe('draft');
    expect(app.company).toBe('Acme');
    expect(app.role).toBe('Senior Engineer');
    expect(app.jobDescriptionId).toBe('jd1');
    // resumeId links to the newly created resume
    const resumes = useAppStore.getState().resumes;
    expect(resumes).toHaveLength(1);
    expect(app.resumeId).toBe(resumes[0].id);
    // Has an initial 'draft' event
    expect(app.events).toHaveLength(1);
    expect(app.events[0].status).toBe('draft');
  });

  it('without a JD the generate short-circuits and no application is created', async () => {
    seedStore({ activeJobDescriptionId: null });
    mockEndTurnClient();
    const { result } = renderHook(() => useGenerateResume());
    await act(async () => {
      await result.current.generate();
    });
    expect(useAppStore.getState().applications).toHaveLength(0);
    expect(result.current.error).toMatch(/job description/i);
  });

  it('two sequential generations for the same JD produce two resumes and two applications (one per resume)', async () => {
    seedStore();
    mockEndTurnClient();
    const { result } = renderHook(() => useGenerateResume());
    await act(async () => {
      await result.current.generate();
    });
    await act(async () => {
      await result.current.generate();
    });
    const resumes = useAppStore.getState().resumes;
    const apps = useAppStore.getState().applications;
    expect(resumes).toHaveLength(2);
    expect(apps).toHaveLength(2);
    // Each application links to a distinct resume (1:1 guarantee)
    const resumeIds = new Set(apps.map((a) => a.resumeId));
    expect(resumeIds.size).toBe(2);
  });

  it('idempotent: addApplication called twice with the same resumeId only creates one application (race guard)', () => {
    seedStore();
    const resumeId = 'res-race';
    const addApplication = useAppStore.getState().addApplication;
    const mkApp = (id: string) => ({
      id,
      resumeId,
      jobDescriptionId: 'jd1',
      company: 'Acme',
      role: 'SWE',
      status: 'draft' as const,
      appliedAt: null,
      events: [{ id: `ev-${id}`, status: 'draft' as const, date: '2026-04-01T00:00:00.000Z' }],
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    });
    addApplication(mkApp('first'));
    addApplication(mkApp('second'));
    const apps = useAppStore.getState().applications;
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe('first');
  });
});
