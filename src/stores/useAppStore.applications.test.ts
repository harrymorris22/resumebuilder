import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { Application, ApplicationEvent, ApplicationStatus, Resume } from '../types/resume';
import { createDefaultResume } from '../utils/resumeDefaults';

vi.mock('../db/persistence', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../db/persistence');
  return {
    ...actual,
    saveApplication: vi.fn(),
    deleteApplication: vi.fn(),
    deleteResume: vi.fn(),
    saveResume: vi.fn(),
    getAllResumes: vi.fn().mockResolvedValue([]),
    getAllChatSessions: vi.fn().mockResolvedValue([]),
    getAllContentBankItems: vi.fn().mockResolvedValue([]),
    getAllContentPoolEntries: vi.fn().mockResolvedValue([]),
    getAllJobDescriptions: vi.fn().mockResolvedValue([]),
    getAllRecommendations: vi.fn().mockResolvedValue([]),
    getAllInterviewQuestions: vi.fn().mockResolvedValue([]),
    getInterviewPrep: vi.fn().mockResolvedValue(undefined),
    getAllApplications: vi.fn().mockResolvedValue([]),
    saveChatSession: vi.fn(),
  };
});

import {
  saveApplication,
  deleteApplication,
  deleteResume as deleteResumeFromDb,
  getAllApplications,
  getAllResumes,
  getAllJobDescriptions,
} from '../db/persistence';

const mockSave = vi.mocked(saveApplication);
const mockDelete = vi.mocked(deleteApplication);
const mockDeleteResume = vi.mocked(deleteResumeFromDb);
const mockGetAllApps = vi.mocked(getAllApplications);
const mockGetAllResumes = vi.mocked(getAllResumes);
const mockGetAllJobDescriptions = vi.mocked(getAllJobDescriptions);

function mkApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    resumeId: 'res-1',
    jobDescriptionId: 'jd-1',
    company: 'Acme',
    role: 'SWE',
    status: 'draft',
    appliedAt: null,
    events: [
      { id: 'ev-0', status: 'draft', date: '2026-04-01T00:00:00.000Z' },
    ],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

function mkEvent(status: ApplicationStatus, date = '2026-04-05T00:00:00.000Z'): ApplicationEvent {
  return { id: `ev-${status}-${date}`, status, date };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    applications: [],
    resumes: [],
    userId: null,
    activeResumeId: null,
  } as never);
});

describe('useAppStore — addApplication', () => {
  it('appends to state and persists', () => {
    useAppStore.getState().addApplication(mkApp());
    expect(useAppStore.getState().applications).toHaveLength(1);
    expect(mockSave).toHaveBeenCalledOnce();
    expect(mockSave).toHaveBeenCalledWith(null, expect.objectContaining({ id: 'app-1' }));
  });

  it('is idempotent — second call for same resumeId is a no-op', () => {
    useAppStore.getState().addApplication(mkApp({ id: 'app-1', resumeId: 'res-1' }));
    useAppStore.getState().addApplication(mkApp({ id: 'app-2', resumeId: 'res-1' }));
    expect(useAppStore.getState().applications).toHaveLength(1);
    expect(useAppStore.getState().applications[0].id).toBe('app-1');
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('allows distinct apps for distinct resumeIds', () => {
    useAppStore.getState().addApplication(mkApp({ id: 'app-1', resumeId: 'res-1' }));
    useAppStore.getState().addApplication(mkApp({ id: 'app-2', resumeId: 'res-2' }));
    expect(useAppStore.getState().applications).toHaveLength(2);
    expect(mockSave).toHaveBeenCalledTimes(2);
  });
});

describe('useAppStore — updateApplication', () => {
  it('patches and bumps updatedAt and persists', () => {
    const original = mkApp({ updatedAt: '2026-04-01T00:00:00.000Z' });
    useAppStore.setState({ applications: [original] } as never);
    mockSave.mockClear();

    useAppStore.getState().updateApplication('app-1', { notes: 'cool company' });

    const updated = useAppStore.getState().applications[0];
    expect(updated.notes).toBe('cool company');
    expect(updated.updatedAt).not.toBe('2026-04-01T00:00:00.000Z');
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('leaves other applications untouched', () => {
    useAppStore.setState({
      applications: [mkApp({ id: 'app-1' }), mkApp({ id: 'app-2', resumeId: 'res-2' })],
    } as never);
    useAppStore.getState().updateApplication('app-1', { notes: 'note' });
    expect(useAppStore.getState().applications[1].notes).toBeUndefined();
  });

  // Type-level guard: ApplicationPatch forbids status/events/appliedAt.
  // We can't run TS at test time, but we can document the guard exists.
  it('ApplicationPatch type forbids status/events/appliedAt (compile-time)', () => {
    // @ts-expect-error — status cannot be patched through updateApplication
    const patchA: import('../types/resume').ApplicationPatch = { status: 'offer' };
    // @ts-expect-error — events cannot be patched through updateApplication
    const patchB: import('../types/resume').ApplicationPatch = { events: [] };
    // @ts-expect-error — appliedAt cannot be patched through updateApplication
    const patchC: import('../types/resume').ApplicationPatch = { appliedAt: '2026-04-01' };
    // Silence unused-var warnings — these are only here for their ts-expect-error.
    void patchA; void patchB; void patchC;
  });
});

describe('useAppStore — removeApplication', () => {
  it('removes from state and calls deleteApplication', () => {
    useAppStore.setState({ applications: [mkApp()] } as never);
    useAppStore.getState().removeApplication('app-1');
    expect(useAppStore.getState().applications).toHaveLength(0);
    expect(mockDelete).toHaveBeenCalledWith(null, 'app-1');
  });
});

describe('useAppStore — addApplicationEvent', () => {
  it('appends event, updates status cache, bumps updatedAt, persists', () => {
    useAppStore.setState({ applications: [mkApp()] } as never);
    mockSave.mockClear();

    useAppStore.getState().addApplicationEvent('app-1', mkEvent('applied'));

    const app = useAppStore.getState().applications[0];
    expect(app.events).toHaveLength(2);
    expect(app.status).toBe('applied');
    expect(app.updatedAt).not.toBe('2026-04-01T00:00:00.000Z');
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('sets appliedAt on first transition into an ACTIVE status', () => {
    useAppStore.setState({ applications: [mkApp({ appliedAt: null })] } as never);
    useAppStore.getState().addApplicationEvent('app-1', mkEvent('applied', '2026-04-10T00:00:00.000Z'));
    expect(useAppStore.getState().applications[0].appliedAt).toBe('2026-04-10T00:00:00.000Z');
  });

  it('sets appliedAt on direct jump to phone_screen (active but not applied)', () => {
    useAppStore.setState({ applications: [mkApp({ appliedAt: null })] } as never);
    useAppStore.getState().addApplicationEvent('app-1', mkEvent('phone_screen', '2026-04-10T00:00:00.000Z'));
    expect(useAppStore.getState().applications[0].appliedAt).toBe('2026-04-10T00:00:00.000Z');
  });

  it('does NOT set appliedAt on draft → terminal (rejected/withdrawn/ghosted)', () => {
    for (const terminal of ['rejected', 'withdrawn', 'ghosted'] as const) {
      useAppStore.setState({
        applications: [mkApp({ id: `app-${terminal}`, resumeId: `res-${terminal}`, appliedAt: null })],
      } as never);
      useAppStore.getState().addApplicationEvent(`app-${terminal}`, mkEvent(terminal));
      const app = useAppStore.getState().applications[0];
      expect(app.appliedAt).toBeNull();
      expect(app.status).toBe(terminal);
    }
  });

  it('does NOT re-set appliedAt once it is already set (first-fire semantics)', () => {
    useAppStore.setState({
      applications: [mkApp({ appliedAt: '2026-04-02T00:00:00.000Z', status: 'applied' })],
    } as never);
    useAppStore.getState().addApplicationEvent('app-1', mkEvent('phone_screen', '2026-04-20T00:00:00.000Z'));
    expect(useAppStore.getState().applications[0].appliedAt).toBe('2026-04-02T00:00:00.000Z');
  });

  it('is a no-op for unknown appId', () => {
    useAppStore.setState({ applications: [mkApp()] } as never);
    mockSave.mockClear();
    useAppStore.getState().addApplicationEvent('nonexistent', mkEvent('applied'));
    expect(useAppStore.getState().applications[0].events).toHaveLength(1);
    // save is still called with the unchanged app because get().applications.find
    // finds the existing one; but the state didn't change semantically. We don't
    // assert saves here — behavior just can't corrupt state.
  });
});

describe('useAppStore — removeResume cascades to applications', () => {
  it('deletes the application tied to the removed resume, keeps others', () => {
    const resumeA: Resume = { ...createDefaultResume(), id: 'res-A' };
    const resumeB: Resume = { ...createDefaultResume(), id: 'res-B' };
    useAppStore.setState({
      resumes: [resumeA, resumeB],
      activeResumeId: 'res-A',
      applications: [
        mkApp({ id: 'app-A', resumeId: 'res-A' }),
        mkApp({ id: 'app-B', resumeId: 'res-B' }),
      ],
    } as never);

    useAppStore.getState().removeResume('res-A');

    const apps = useAppStore.getState().applications;
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe('app-B');
    expect(mockDelete).toHaveBeenCalledWith(null, 'app-A');
    expect(mockDeleteResume).toHaveBeenCalledWith(null, 'res-A');
  });

  it('does not cascade if deletion is blocked (last resume)', () => {
    const onlyResume: Resume = { ...createDefaultResume(), id: 'res-A' };
    useAppStore.setState({
      resumes: [onlyResume],
      applications: [mkApp({ id: 'app-A', resumeId: 'res-A' })],
    } as never);

    useAppStore.getState().removeResume('res-A');

    // Last-resume guard blocks the deletion entirely.
    expect(useAppStore.getState().applications).toHaveLength(1);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe('useAppStore — hydrateFromIdb loads applications', () => {
  it('puts loaded applications into state', async () => {
    mockGetAllApps.mockResolvedValueOnce([mkApp({ id: 'hydrated-1' })]);
    await useAppStore.getState().hydrateFromIdb(null);
    expect(useAppStore.getState().applications).toHaveLength(1);
    expect(useAppStore.getState().applications[0].id).toBe('hydrated-1');
  });
});

describe('useAppStore — hydrateFromIdb backfills applications from existing resumes', () => {
  // Backfill: pre-v0.8.0.0 resumes were generated before the Applications
  // feature shipped. On hydrate, walk the resume list and create a draft
  // application for every resume with a targetJobId that doesn't already
  // have one.
  function mkResume(overrides: Partial<Resume> = {}): Resume {
    return {
      ...createDefaultResume(),
      id: 'res-X',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      ...overrides,
    };
  }

  function mkJd(overrides: Partial<import('../types/resume').JobDescription> = {}) {
    return {
      id: 'jd-X',
      title: 'Senior Engineer',
      company: 'Acme',
      rawText: '...',
      keywords: [],
      createdAt: '2026-03-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('creates draft applications for resumes with targetJobId and matching JD', async () => {
    mockGetAllResumes.mockResolvedValueOnce([
      mkResume({ id: 'res-A', targetJobId: 'jd-A', createdAt: '2026-03-01T00:00:00.000Z' }),
      mkResume({ id: 'res-B', targetJobId: 'jd-B', createdAt: '2026-03-15T00:00:00.000Z' }),
    ]);
    mockGetAllJobDescriptions.mockResolvedValueOnce([
      mkJd({ id: 'jd-A', title: 'Backend Eng', company: 'Acme' }),
      mkJd({ id: 'jd-B', title: 'Frontend Eng', company: 'Beta Corp' }),
    ]);
    mockGetAllApps.mockResolvedValueOnce([]);

    await useAppStore.getState().hydrateFromIdb(null);

    const apps = useAppStore.getState().applications;
    expect(apps).toHaveLength(2);

    const appA = apps.find((a) => a.resumeId === 'res-A');
    const appB = apps.find((a) => a.resumeId === 'res-B');
    expect(appA).toBeDefined();
    expect(appA?.status).toBe('draft');
    expect(appA?.company).toBe('Acme');
    expect(appA?.role).toBe('Backend Eng');
    expect(appA?.jobDescriptionId).toBe('jd-A');
    expect(appA?.appliedAt).toBeNull();
    expect(appA?.events).toHaveLength(1);
    expect(appA?.events[0].status).toBe('draft');
    expect(appA?.events[0].date).toBe('2026-03-01T00:00:00.000Z');
    expect(appA?.createdAt).toBe('2026-03-01T00:00:00.000Z');

    expect(appB?.role).toBe('Frontend Eng');
    expect(appB?.company).toBe('Beta Corp');
    expect(appB?.createdAt).toBe('2026-03-15T00:00:00.000Z');

    // Each backfilled app got persisted.
    expect(mockSave).toHaveBeenCalledTimes(2);
  });

  it('skips resumes without targetJobId', async () => {
    mockGetAllResumes.mockResolvedValueOnce([
      mkResume({ id: 'res-master' }), // no targetJobId — master resume
    ]);
    mockGetAllJobDescriptions.mockResolvedValueOnce([]);
    mockGetAllApps.mockResolvedValueOnce([]);

    await useAppStore.getState().hydrateFromIdb(null);

    expect(useAppStore.getState().applications).toHaveLength(0);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('skips resumes whose targetJobId points to a deleted JD', async () => {
    mockGetAllResumes.mockResolvedValueOnce([
      mkResume({ id: 'res-orphan', targetJobId: 'jd-deleted' }),
    ]);
    mockGetAllJobDescriptions.mockResolvedValueOnce([]); // JD was deleted
    mockGetAllApps.mockResolvedValueOnce([]);

    await useAppStore.getState().hydrateFromIdb(null);

    expect(useAppStore.getState().applications).toHaveLength(0);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does not double-create applications that already exist (idempotent)', async () => {
    const existing = mkApp({ id: 'app-existing', resumeId: 'res-A', jobDescriptionId: 'jd-A' });
    mockGetAllResumes.mockResolvedValueOnce([
      mkResume({ id: 'res-A', targetJobId: 'jd-A' }),
    ]);
    mockGetAllJobDescriptions.mockResolvedValueOnce([
      mkJd({ id: 'jd-A' }),
    ]);
    mockGetAllApps.mockResolvedValueOnce([existing]);

    await useAppStore.getState().hydrateFromIdb(null);

    const apps = useAppStore.getState().applications;
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe('app-existing');
    expect(mockSave).not.toHaveBeenCalled(); // backfill skipped, no new save
  });
});
