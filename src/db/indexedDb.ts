import { openDB, type IDBPDatabase } from 'idb';
import type { Resume, ContentBankItem, ContentPoolEntry, CoverLetter, JobDescription } from '../types/resume';
import type { ChatSession } from '../types/chat';
import type { Recommendation } from '../types/recommendation';

const DB_NAME = 'resume-builder';
const DB_VERSION = 3;

interface ResumeBuilderDB {
  resumes: Resume;
  chatSessions: ChatSession;
  contentBank: ContentBankItem;
  contentPool: ContentPoolEntry;
  coverLetters: CoverLetter;
  jobDescriptions: JobDescription;
  recommendations: Recommendation;
}

let dbInstance: IDBPDatabase<ResumeBuilderDB> | null = null;
let dbAvailable = true;

async function getDb(): Promise<IDBPDatabase<ResumeBuilderDB> | null> {
  if (!dbAvailable) return null;
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<ResumeBuilderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('resumes')) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chatSessions')) {
          db.createObjectStore('chatSessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('contentBank')) {
          const store = db.createObjectStore('contentBank', { keyPath: 'id' });
          store.createIndex('byType', 'type');
          store.createIndex('byCreatedAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('contentPool')) {
          db.createObjectStore('contentPool', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('coverLetters')) {
          db.createObjectStore('coverLetters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('jobDescriptions')) {
          db.createObjectStore('jobDescriptions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recommendations')) {
          db.createObjectStore('recommendations', { keyPath: 'id' });
        }
      },
    });
    return dbInstance;
  } catch {
    console.warn('IndexedDB unavailable. Data will not persist.');
    dbAvailable = false;
    return null;
  }
}

export function isIdbAvailable(): boolean {
  return dbAvailable;
}

// --- Resumes ---

export async function saveResume(resume: Resume): Promise<void> {
  const db = await getDb();
  if (db) await db.put('resumes', resume);
}

export async function getResume(id: string): Promise<Resume | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return db.get('resumes', id);
}

export async function getAllResumes(): Promise<Resume[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll('resumes');
}

export async function deleteResume(id: string): Promise<void> {
  const db = await getDb();
  if (db) await db.delete('resumes', id);
}

// --- Chat Sessions ---

export async function saveChatSession(session: ChatSession): Promise<void> {
  const db = await getDb();
  if (db) await db.put('chatSessions', session);
}

export async function getChatSession(id: string): Promise<ChatSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return db.get('chatSessions', id);
}

export async function getAllChatSessions(): Promise<ChatSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll('chatSessions');
}

// --- Content Bank ---

export async function saveContentBankItem(item: ContentBankItem): Promise<void> {
  const db = await getDb();
  if (db) await db.put('contentBank', item);
}

export async function getAllContentBankItems(): Promise<ContentBankItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll('contentBank');
}

export async function deleteContentBankItem(id: string): Promise<void> {
  const db = await getDb();
  if (db) await db.delete('contentBank', id);
}

// --- Content Pool ---

export async function saveContentPoolEntry(entry: ContentPoolEntry): Promise<void> {
  const db = await getDb();
  if (db) await db.put('contentPool', entry);
}

export async function getAllContentPoolEntries(): Promise<ContentPoolEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll('contentPool');
}

export async function deleteContentPoolEntry(id: string): Promise<void> {
  const db = await getDb();
  if (db) await db.delete('contentPool', id);
}

// --- Cover Letters ---

export async function saveCoverLetter(letter: CoverLetter): Promise<void> {
  const db = await getDb();
  if (db) await db.put('coverLetters', letter);
}

export async function getCoverLetter(resumeId: string): Promise<CoverLetter | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const all = await db.getAll('coverLetters');
  return all.find(l => l.resumeId === resumeId);
}

// --- Job Descriptions ---

export async function saveJobDescription(jd: JobDescription): Promise<void> {
  const db = await getDb();
  if (db) await db.put('jobDescriptions', jd);
}

export async function getAllJobDescriptions(): Promise<JobDescription[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll('jobDescriptions');
}

export async function deleteJobDescription(id: string): Promise<void> {
  const db = await getDb();
  if (db) await db.delete('jobDescriptions', id);
}

// --- Recommendations ---

export async function saveRecommendation(rec: Recommendation): Promise<void> {
  const db = await getDb();
  if (db) await db.put('recommendations', rec);
}

export async function getAllRecommendations(): Promise<Recommendation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll('recommendations');
}

export async function deleteRecommendation(id: string): Promise<void> {
  const db = await getDb();
  if (db) await db.delete('recommendations', id);
}

export async function clearRecommendations(): Promise<void> {
  const db = await getDb();
  if (db) await db.clear('recommendations');
}
