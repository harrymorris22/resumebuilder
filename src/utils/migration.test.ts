import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- IDB mocks ---
const mockIdbGetAllResumes = vi.fn();
const mockIdbGetAllContentPoolEntries = vi.fn();
const mockIdbGetAllChatSessions = vi.fn();
const mockIdbGetAllJobDescriptions = vi.fn();
const mockIdbGetAllContentBankItems = vi.fn();
const mockIdbGetAllRecommendations = vi.fn();
const mockIdbGetAllApplications = vi.fn();
const mockIdbGetCoverLetter = vi.fn();

vi.mock('../db/indexedDb', () => ({
  getAllResumes: (...args: unknown[]) => mockIdbGetAllResumes(...args),
  getAllContentPoolEntries: (...args: unknown[]) => mockIdbGetAllContentPoolEntries(...args),
  getAllChatSessions: (...args: unknown[]) => mockIdbGetAllChatSessions(...args),
  getAllJobDescriptions: (...args: unknown[]) => mockIdbGetAllJobDescriptions(...args),
  getAllContentBankItems: (...args: unknown[]) => mockIdbGetAllContentBankItems(...args),
  getAllRecommendations: (...args: unknown[]) => mockIdbGetAllRecommendations(...args),
  getAllApplications: (...args: unknown[]) => mockIdbGetAllApplications(...args),
  getCoverLetter: (...args: unknown[]) => mockIdbGetCoverLetter(...args),
}));

// --- Firestore mocks ---
const mockFsGetAllResumes = vi.fn();
const mockFsGetAllContentPoolEntries = vi.fn();
const mockFsSaveResume = vi.fn();
const mockFsSaveContentPoolEntry = vi.fn();
const mockFsSaveChatSession = vi.fn();
const mockFsSaveContentBankItem = vi.fn();
const mockFsSaveJobDescription = vi.fn();
const mockFsSaveRecommendation = vi.fn();
const mockFsSaveCoverLetter = vi.fn();
const mockFsSaveApplication = vi.fn();

vi.mock('../db/firestoreDb', () => ({
  getAllResumes: (...args: unknown[]) => mockFsGetAllResumes(...args),
  getAllContentPoolEntries: (...args: unknown[]) => mockFsGetAllContentPoolEntries(...args),
  saveResume: (...args: unknown[]) => mockFsSaveResume(...args),
  saveContentPoolEntry: (...args: unknown[]) => mockFsSaveContentPoolEntry(...args),
  saveChatSession: (...args: unknown[]) => mockFsSaveChatSession(...args),
  saveContentBankItem: (...args: unknown[]) => mockFsSaveContentBankItem(...args),
  saveJobDescription: (...args: unknown[]) => mockFsSaveJobDescription(...args),
  saveRecommendation: (...args: unknown[]) => mockFsSaveRecommendation(...args),
  saveCoverLetter: (...args: unknown[]) => mockFsSaveCoverLetter(...args),
  saveApplication: (...args: unknown[]) => mockFsSaveApplication(...args),
}));

import {
  isMigrationDone,
  markMigrationDone,
  hasLocalData,
  isFirestoreEmpty,
  migrateIdbToFirestore,
} from './migration';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  // Default: everything returns empty
  mockIdbGetAllResumes.mockResolvedValue([]);
  mockIdbGetAllContentPoolEntries.mockResolvedValue([]);
  mockIdbGetAllChatSessions.mockResolvedValue([]);
  mockIdbGetAllJobDescriptions.mockResolvedValue([]);
  mockIdbGetAllContentBankItems.mockResolvedValue([]);
  mockIdbGetAllRecommendations.mockResolvedValue([]);
  mockIdbGetAllApplications.mockResolvedValue([]);
  mockIdbGetCoverLetter.mockResolvedValue(undefined);

  mockFsGetAllResumes.mockResolvedValue([]);
  mockFsGetAllContentPoolEntries.mockResolvedValue([]);
  mockFsSaveResume.mockResolvedValue(undefined);
  mockFsSaveContentPoolEntry.mockResolvedValue(undefined);
  mockFsSaveChatSession.mockResolvedValue(undefined);
  mockFsSaveContentBankItem.mockResolvedValue(undefined);
  mockFsSaveJobDescription.mockResolvedValue(undefined);
  mockFsSaveRecommendation.mockResolvedValue(undefined);
  mockFsSaveCoverLetter.mockResolvedValue(undefined);
  mockFsSaveApplication.mockResolvedValue(undefined);
});

describe('isMigrationDone / markMigrationDone', () => {
  it('returns false when not yet marked', () => {
    expect(isMigrationDone('user-1')).toBe(false);
  });

  it('returns true after marking', () => {
    markMigrationDone('user-1');
    expect(isMigrationDone('user-1')).toBe(true);
  });

  it('is scoped per user', () => {
    markMigrationDone('user-1');
    expect(isMigrationDone('user-2')).toBe(false);
  });
});

describe('hasLocalData', () => {
  it('returns false when IDB is empty', async () => {
    expect(await hasLocalData()).toBe(false);
  });

  it('returns false for a single empty default resume', async () => {
    mockIdbGetAllResumes.mockResolvedValue([{
      id: 'r1',
      sections: [
        { content: { type: 'contact', data: { fullName: '' } } },
        { content: { type: 'experience', data: { items: [] } } },
      ],
    }]);
    expect(await hasLocalData()).toBe(false);
  });

  it('returns true when resume has contact name filled', async () => {
    mockIdbGetAllResumes.mockResolvedValue([{
      id: 'r1',
      sections: [
        { content: { type: 'contact', data: { fullName: 'Jane Doe' } } },
      ],
    }]);
    expect(await hasLocalData()).toBe(true);
  });

  it('returns true when resume has experience items', async () => {
    mockIdbGetAllResumes.mockResolvedValue([{
      id: 'r1',
      sections: [
        { content: { type: 'experience', data: { items: [{ company: 'Acme' }] } } },
      ],
    }]);
    expect(await hasLocalData()).toBe(true);
  });

  it('returns true when multiple resumes exist', async () => {
    mockIdbGetAllResumes.mockResolvedValue([
      { id: 'r1', sections: [] },
      { id: 'r2', sections: [] },
    ]);
    expect(await hasLocalData()).toBe(true);
  });

  it('returns true when content pool has entries', async () => {
    mockIdbGetAllContentPoolEntries.mockResolvedValue([{ id: 'cp1' }]);
    expect(await hasLocalData()).toBe(true);
  });

  it('returns true when chat sessions exist', async () => {
    mockIdbGetAllChatSessions.mockResolvedValue([{ id: 'cs1' }]);
    expect(await hasLocalData()).toBe(true);
  });

  it('returns true when job descriptions exist', async () => {
    mockIdbGetAllJobDescriptions.mockResolvedValue([{ id: 'jd1' }]);
    expect(await hasLocalData()).toBe(true);
  });
});

describe('isFirestoreEmpty', () => {
  it('returns true when Firestore has no data', async () => {
    expect(await isFirestoreEmpty('user-1')).toBe(true);
    expect(mockFsGetAllResumes).toHaveBeenCalledWith('user-1');
    expect(mockFsGetAllContentPoolEntries).toHaveBeenCalledWith('user-1');
  });

  it('returns false when Firestore has resumes', async () => {
    mockFsGetAllResumes.mockResolvedValue([{ id: 'r1' }]);
    expect(await isFirestoreEmpty('user-1')).toBe(false);
  });

  it('returns false when Firestore has content pool entries', async () => {
    mockFsGetAllContentPoolEntries.mockResolvedValue([{ id: 'cp1' }]);
    expect(await isFirestoreEmpty('user-1')).toBe(false);
  });
});

describe('migrateIdbToFirestore', () => {
  it('copies all data types from IDB to Firestore', async () => {
    const resume = { id: 'r1', name: 'My Resume', sections: [] };
    const poolEntry = { id: 'cp1', item: { type: 'summary' } };
    const chatSession = { id: 'cs1', resumeId: 'r1', messages: [] };
    const contentBankItem = { id: 'cb1' };
    const jobDescription = { id: 'jd1', text: 'Software Engineer' };
    const recommendation = { id: 'rec1', text: 'Add more details' };
    const application = { id: 'app1', resumeId: 'r1', status: 'draft' };

    mockIdbGetAllResumes.mockResolvedValue([resume]);
    mockIdbGetAllContentPoolEntries.mockResolvedValue([poolEntry]);
    mockIdbGetAllChatSessions.mockResolvedValue([chatSession]);
    mockIdbGetAllContentBankItems.mockResolvedValue([contentBankItem]);
    mockIdbGetAllJobDescriptions.mockResolvedValue([jobDescription]);
    mockIdbGetAllRecommendations.mockResolvedValue([recommendation]);
    mockIdbGetAllApplications.mockResolvedValue([application]);
    mockIdbGetCoverLetter.mockResolvedValue(undefined);

    const result = await migrateIdbToFirestore('user-1');

    expect(mockFsSaveResume).toHaveBeenCalledWith('user-1', resume);
    expect(mockFsSaveContentPoolEntry).toHaveBeenCalledWith('user-1', poolEntry);
    expect(mockFsSaveChatSession).toHaveBeenCalledWith('user-1', chatSession);
    expect(mockFsSaveContentBankItem).toHaveBeenCalledWith('user-1', contentBankItem);
    expect(mockFsSaveJobDescription).toHaveBeenCalledWith('user-1', jobDescription);
    expect(mockFsSaveRecommendation).toHaveBeenCalledWith('user-1', recommendation);
    expect(mockFsSaveApplication).toHaveBeenCalledWith('user-1', application);

    expect(result).toEqual({
      resumes: 1,
      contentPool: 1,
      chatSessions: 1,
      contentBankItems: 1,
      coverLetters: 0,
      jobDescriptions: 1,
      recommendations: 1,
      applications: 1,
    });
  });

  it('migrates cover letters found per-resume', async () => {
    const resume = { id: 'r1', sections: [] };
    const coverLetter = { id: 'cl1', resumeId: 'r1', text: 'Dear...' };

    mockIdbGetAllResumes.mockResolvedValue([resume]);
    mockIdbGetCoverLetter.mockResolvedValue(coverLetter);

    const result = await migrateIdbToFirestore('user-1');

    expect(mockIdbGetCoverLetter).toHaveBeenCalledWith('r1');
    expect(mockFsSaveCoverLetter).toHaveBeenCalledWith('user-1', coverLetter);
    expect(result.coverLetters).toBe(1);
  });

  it('marks migration as done after successful migration', async () => {
    await migrateIdbToFirestore('user-1');
    expect(isMigrationDone('user-1')).toBe(true);
  });

  it('handles empty IDB gracefully', async () => {
    const result = await migrateIdbToFirestore('user-1');

    expect(result).toEqual({
      resumes: 0,
      contentPool: 0,
      chatSessions: 0,
      contentBankItems: 0,
      coverLetters: 0,
      jobDescriptions: 0,
      recommendations: 0,
      applications: 0,
    });
    expect(isMigrationDone('user-1')).toBe(true);
  });

  it('handles multiple resumes with cover letters', async () => {
    const resumes = [
      { id: 'r1', sections: [] },
      { id: 'r2', sections: [] },
    ];
    const cl1 = { id: 'cl1', resumeId: 'r1', text: 'Dear A' };
    const cl2 = { id: 'cl2', resumeId: 'r2', text: 'Dear B' };

    mockIdbGetAllResumes.mockResolvedValue(resumes);
    mockIdbGetCoverLetter
      .mockResolvedValueOnce(cl1)
      .mockResolvedValueOnce(cl2);

    const result = await migrateIdbToFirestore('user-1');

    expect(mockFsSaveCoverLetter).toHaveBeenCalledTimes(2);
    expect(result.coverLetters).toBe(2);
    expect(result.resumes).toBe(2);
  });
});
