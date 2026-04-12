import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Resume, ContentBankItem, ContentPoolEntry, CoverLetter, JobDescription } from '../types/resume';
import type { ChatSession } from '../types/chat';
import type { Recommendation } from '../types/recommendation';

vi.mock('./indexedDb');
vi.mock('./firestoreDb');

// Import after mocks are declared
import * as persistence from './persistence';
import * as idb from './indexedDb';
import * as firestore from './firestoreDb';

const UID = 'user-123';
const ID = 'item-abc';

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------- Resumes ----------

describe('Resumes', () => {
  const resume = { id: ID } as Resume;

  it('saveResume → idb when uid is null', async () => {
    await persistence.saveResume(null, resume);
    expect(idb.saveResume).toHaveBeenCalledWith(resume);
    expect(firestore.saveResume).not.toHaveBeenCalled();
  });

  it('saveResume → firestore when uid is set', async () => {
    await persistence.saveResume(UID, resume);
    expect(firestore.saveResume).toHaveBeenCalledWith(UID, resume);
    expect(idb.saveResume).not.toHaveBeenCalled();
  });

  it('getResume → idb when uid is null', async () => {
    await persistence.getResume(null, ID);
    expect(idb.getResume).toHaveBeenCalledWith(ID);
    expect(firestore.getResume).not.toHaveBeenCalled();
  });

  it('getResume → firestore when uid is set', async () => {
    await persistence.getResume(UID, ID);
    expect(firestore.getResume).toHaveBeenCalledWith(UID, ID);
    expect(idb.getResume).not.toHaveBeenCalled();
  });

  it('getAllResumes → idb when uid is null', async () => {
    await persistence.getAllResumes(null);
    expect(idb.getAllResumes).toHaveBeenCalledWith();
    expect(firestore.getAllResumes).not.toHaveBeenCalled();
  });

  it('getAllResumes → firestore when uid is set', async () => {
    await persistence.getAllResumes(UID);
    expect(firestore.getAllResumes).toHaveBeenCalledWith(UID);
    expect(idb.getAllResumes).not.toHaveBeenCalled();
  });

  it('deleteResume → idb when uid is null', async () => {
    await persistence.deleteResume(null, ID);
    expect(idb.deleteResume).toHaveBeenCalledWith(ID);
    expect(firestore.deleteResume).not.toHaveBeenCalled();
  });

  it('deleteResume → firestore when uid is set', async () => {
    await persistence.deleteResume(UID, ID);
    expect(firestore.deleteResume).toHaveBeenCalledWith(UID, ID);
    expect(idb.deleteResume).not.toHaveBeenCalled();
  });
});

// ---------- Chat Sessions ----------

describe('Chat Sessions', () => {
  const session = { id: ID } as ChatSession;

  it('saveChatSession → idb when uid is null', async () => {
    await persistence.saveChatSession(null, session);
    expect(idb.saveChatSession).toHaveBeenCalledWith(session);
    expect(firestore.saveChatSession).not.toHaveBeenCalled();
  });

  it('saveChatSession → firestore when uid is set', async () => {
    await persistence.saveChatSession(UID, session);
    expect(firestore.saveChatSession).toHaveBeenCalledWith(UID, session);
    expect(idb.saveChatSession).not.toHaveBeenCalled();
  });

  it('getChatSession → idb when uid is null', async () => {
    await persistence.getChatSession(null, ID);
    expect(idb.getChatSession).toHaveBeenCalledWith(ID);
    expect(firestore.getChatSession).not.toHaveBeenCalled();
  });

  it('getChatSession → firestore when uid is set', async () => {
    await persistence.getChatSession(UID, ID);
    expect(firestore.getChatSession).toHaveBeenCalledWith(UID, ID);
    expect(idb.getChatSession).not.toHaveBeenCalled();
  });

  it('getAllChatSessions → idb when uid is null', async () => {
    await persistence.getAllChatSessions(null);
    expect(idb.getAllChatSessions).toHaveBeenCalledWith();
    expect(firestore.getAllChatSessions).not.toHaveBeenCalled();
  });

  it('getAllChatSessions → firestore when uid is set', async () => {
    await persistence.getAllChatSessions(UID);
    expect(firestore.getAllChatSessions).toHaveBeenCalledWith(UID);
    expect(idb.getAllChatSessions).not.toHaveBeenCalled();
  });
});

// ---------- Content Bank (legacy) ----------

describe('Content Bank', () => {
  const item = { id: ID } as ContentBankItem;

  it('saveContentBankItem → idb when uid is null', async () => {
    await persistence.saveContentBankItem(null, item);
    expect(idb.saveContentBankItem).toHaveBeenCalledWith(item);
    expect(firestore.saveContentBankItem).not.toHaveBeenCalled();
  });

  it('saveContentBankItem → firestore when uid is set', async () => {
    await persistence.saveContentBankItem(UID, item);
    expect(firestore.saveContentBankItem).toHaveBeenCalledWith(UID, item);
    expect(idb.saveContentBankItem).not.toHaveBeenCalled();
  });

  it('getAllContentBankItems → idb when uid is null', async () => {
    await persistence.getAllContentBankItems(null);
    expect(idb.getAllContentBankItems).toHaveBeenCalledWith();
    expect(firestore.getAllContentBankItems).not.toHaveBeenCalled();
  });

  it('getAllContentBankItems → firestore when uid is set', async () => {
    await persistence.getAllContentBankItems(UID);
    expect(firestore.getAllContentBankItems).toHaveBeenCalledWith(UID);
    expect(idb.getAllContentBankItems).not.toHaveBeenCalled();
  });

  it('deleteContentBankItem → idb when uid is null', async () => {
    await persistence.deleteContentBankItem(null, ID);
    expect(idb.deleteContentBankItem).toHaveBeenCalledWith(ID);
    expect(firestore.deleteContentBankItem).not.toHaveBeenCalled();
  });

  it('deleteContentBankItem → firestore when uid is set', async () => {
    await persistence.deleteContentBankItem(UID, ID);
    expect(firestore.deleteContentBankItem).toHaveBeenCalledWith(UID, ID);
    expect(idb.deleteContentBankItem).not.toHaveBeenCalled();
  });
});

// ---------- Content Pool ----------

describe('Content Pool', () => {
  const entry = { id: ID } as ContentPoolEntry;

  it('saveContentPoolEntry → idb when uid is null', async () => {
    await persistence.saveContentPoolEntry(null, entry);
    expect(idb.saveContentPoolEntry).toHaveBeenCalledWith(entry);
    expect(firestore.saveContentPoolEntry).not.toHaveBeenCalled();
  });

  it('saveContentPoolEntry → firestore when uid is set', async () => {
    await persistence.saveContentPoolEntry(UID, entry);
    expect(firestore.saveContentPoolEntry).toHaveBeenCalledWith(UID, entry);
    expect(idb.saveContentPoolEntry).not.toHaveBeenCalled();
  });

  it('getAllContentPoolEntries → idb when uid is null', async () => {
    await persistence.getAllContentPoolEntries(null);
    expect(idb.getAllContentPoolEntries).toHaveBeenCalledWith();
    expect(firestore.getAllContentPoolEntries).not.toHaveBeenCalled();
  });

  it('getAllContentPoolEntries → firestore when uid is set', async () => {
    await persistence.getAllContentPoolEntries(UID);
    expect(firestore.getAllContentPoolEntries).toHaveBeenCalledWith(UID);
    expect(idb.getAllContentPoolEntries).not.toHaveBeenCalled();
  });

  it('deleteContentPoolEntry → idb when uid is null', async () => {
    await persistence.deleteContentPoolEntry(null, ID);
    expect(idb.deleteContentPoolEntry).toHaveBeenCalledWith(ID);
    expect(firestore.deleteContentPoolEntry).not.toHaveBeenCalled();
  });

  it('deleteContentPoolEntry → firestore when uid is set', async () => {
    await persistence.deleteContentPoolEntry(UID, ID);
    expect(firestore.deleteContentPoolEntry).toHaveBeenCalledWith(UID, ID);
    expect(idb.deleteContentPoolEntry).not.toHaveBeenCalled();
  });
});

// ---------- Cover Letters ----------

describe('Cover Letters', () => {
  const letter = { resumeId: ID } as CoverLetter;

  it('saveCoverLetter → idb when uid is null', async () => {
    await persistence.saveCoverLetter(null, letter);
    expect(idb.saveCoverLetter).toHaveBeenCalledWith(letter);
    expect(firestore.saveCoverLetter).not.toHaveBeenCalled();
  });

  it('saveCoverLetter → firestore when uid is set', async () => {
    await persistence.saveCoverLetter(UID, letter);
    expect(firestore.saveCoverLetter).toHaveBeenCalledWith(UID, letter);
    expect(idb.saveCoverLetter).not.toHaveBeenCalled();
  });

  it('getCoverLetter → idb when uid is null', async () => {
    await persistence.getCoverLetter(null, ID);
    expect(idb.getCoverLetter).toHaveBeenCalledWith(ID);
    expect(firestore.getCoverLetter).not.toHaveBeenCalled();
  });

  it('getCoverLetter → firestore when uid is set', async () => {
    await persistence.getCoverLetter(UID, ID);
    expect(firestore.getCoverLetter).toHaveBeenCalledWith(UID, ID);
    expect(idb.getCoverLetter).not.toHaveBeenCalled();
  });
});

// ---------- Job Descriptions ----------

describe('Job Descriptions', () => {
  const jd = { id: ID } as JobDescription;

  it('saveJobDescription → idb when uid is null', async () => {
    await persistence.saveJobDescription(null, jd);
    expect(idb.saveJobDescription).toHaveBeenCalledWith(jd);
    expect(firestore.saveJobDescription).not.toHaveBeenCalled();
  });

  it('saveJobDescription → firestore when uid is set', async () => {
    await persistence.saveJobDescription(UID, jd);
    expect(firestore.saveJobDescription).toHaveBeenCalledWith(UID, jd);
    expect(idb.saveJobDescription).not.toHaveBeenCalled();
  });

  it('getAllJobDescriptions → idb when uid is null', async () => {
    await persistence.getAllJobDescriptions(null);
    expect(idb.getAllJobDescriptions).toHaveBeenCalledWith();
    expect(firestore.getAllJobDescriptions).not.toHaveBeenCalled();
  });

  it('getAllJobDescriptions → firestore when uid is set', async () => {
    await persistence.getAllJobDescriptions(UID);
    expect(firestore.getAllJobDescriptions).toHaveBeenCalledWith(UID);
    expect(idb.getAllJobDescriptions).not.toHaveBeenCalled();
  });

  it('deleteJobDescription → idb when uid is null', async () => {
    await persistence.deleteJobDescription(null, ID);
    expect(idb.deleteJobDescription).toHaveBeenCalledWith(ID);
    expect(firestore.deleteJobDescription).not.toHaveBeenCalled();
  });

  it('deleteJobDescription → firestore when uid is set', async () => {
    await persistence.deleteJobDescription(UID, ID);
    expect(firestore.deleteJobDescription).toHaveBeenCalledWith(UID, ID);
    expect(idb.deleteJobDescription).not.toHaveBeenCalled();
  });
});

// ---------- Recommendations ----------

describe('Recommendations', () => {
  const rec = { id: ID } as Recommendation;

  it('saveRecommendation → idb when uid is null', async () => {
    await persistence.saveRecommendation(null, rec);
    expect(idb.saveRecommendation).toHaveBeenCalledWith(rec);
    expect(firestore.saveRecommendation).not.toHaveBeenCalled();
  });

  it('saveRecommendation → firestore when uid is set', async () => {
    await persistence.saveRecommendation(UID, rec);
    expect(firestore.saveRecommendation).toHaveBeenCalledWith(UID, rec);
    expect(idb.saveRecommendation).not.toHaveBeenCalled();
  });

  it('getAllRecommendations → idb when uid is null', async () => {
    await persistence.getAllRecommendations(null);
    expect(idb.getAllRecommendations).toHaveBeenCalledWith();
    expect(firestore.getAllRecommendations).not.toHaveBeenCalled();
  });

  it('getAllRecommendations → firestore when uid is set', async () => {
    await persistence.getAllRecommendations(UID);
    expect(firestore.getAllRecommendations).toHaveBeenCalledWith(UID);
    expect(idb.getAllRecommendations).not.toHaveBeenCalled();
  });

  it('deleteRecommendation → idb when uid is null', async () => {
    await persistence.deleteRecommendation(null, ID);
    expect(idb.deleteRecommendation).toHaveBeenCalledWith(ID);
    expect(firestore.deleteRecommendation).not.toHaveBeenCalled();
  });

  it('deleteRecommendation → firestore when uid is set', async () => {
    await persistence.deleteRecommendation(UID, ID);
    expect(firestore.deleteRecommendation).toHaveBeenCalledWith(UID, ID);
    expect(idb.deleteRecommendation).not.toHaveBeenCalled();
  });

  it('clearRecommendations → idb when uid is null', async () => {
    await persistence.clearRecommendations(null);
    expect(idb.clearRecommendations).toHaveBeenCalledWith();
    expect(firestore.clearRecommendations).not.toHaveBeenCalled();
  });

  it('clearRecommendations → firestore when uid is set', async () => {
    await persistence.clearRecommendations(UID);
    expect(firestore.clearRecommendations).toHaveBeenCalledWith(UID);
    expect(idb.clearRecommendations).not.toHaveBeenCalled();
  });
});
