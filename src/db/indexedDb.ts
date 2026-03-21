import { openDB, type IDBPDatabase } from 'idb';
import type { Resume, ContentBankItem, CoverLetter } from '../types/resume';
import type { ChatSession } from '../types/chat';

const DB_NAME = 'resume-builder';
const DB_VERSION = 1;

interface ResumeBuilderDB {
  resumes: Resume;
  chatSessions: ChatSession;
  contentBank: ContentBankItem;
  coverLetters: CoverLetter;
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
        if (!db.objectStoreNames.contains('coverLetters')) {
          db.createObjectStore('coverLetters', { keyPath: 'id' });
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
