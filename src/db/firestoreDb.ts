import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Resume, ContentBankItem, ContentPoolEntry, CoverLetter, JobDescription } from '../types/resume';
import type { ChatSession } from '../types/chat';
import type { Recommendation } from '../types/recommendation';

/**
 * Firestore CRUD layer mirroring indexedDb.ts signatures.
 * All functions take uid as first parameter.
 * All functions catch errors, log them, and show a toast. Never throw.
 */

function showToast(message: string) {
  // Simple toast using a custom event — the app can listen for this
  window.dispatchEvent(new CustomEvent('firestore-error', { detail: message }));
  console.error(`[Firestore] ${message}`);
}

function userCol(uid: string, colName: string) {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, 'users', uid, colName);
}

function userDoc(uid: string, colName: string, docId: string) {
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', uid, colName, docId);
}

// --- Resumes ---

export async function saveResume(uid: string, resume: Resume): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'resumes', resume.id), JSON.parse(JSON.stringify(resume)));
  } catch (err) {
    showToast("Couldn't save resume to cloud. Check your connection.");
  }
}

export async function getResume(uid: string, id: string): Promise<Resume | undefined> {
  try {
    const snap = await getDoc(userDoc(uid, 'resumes', id));
    return snap.exists() ? (snap.data() as Resume) : undefined;
  } catch (err) {
    showToast("Couldn't load resume from cloud.");
    return undefined;
  }
}

export async function getAllResumes(uid: string): Promise<Resume[]> {
  try {
    const snap = await getDocs(userCol(uid, 'resumes'));
    return snap.docs.map((d) => d.data() as Resume);
  } catch (err) {
    showToast("Couldn't load resumes from cloud.");
    return [];
  }
}

export async function deleteResume(uid: string, id: string): Promise<void> {
  try {
    await deleteDoc(userDoc(uid, 'resumes', id));
  } catch (err) {
    showToast("Couldn't delete resume from cloud.");
  }
}

// --- Chat Sessions ---

export async function saveChatSession(uid: string, session: ChatSession): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'chatSessions', session.id), JSON.parse(JSON.stringify(session)));
  } catch (err) {
    showToast("Couldn't save chat session to cloud.");
  }
}

export async function getChatSession(uid: string, id: string): Promise<ChatSession | undefined> {
  try {
    const snap = await getDoc(userDoc(uid, 'chatSessions', id));
    return snap.exists() ? (snap.data() as ChatSession) : undefined;
  } catch (err) {
    showToast("Couldn't load chat session from cloud.");
    return undefined;
  }
}

export async function getAllChatSessions(uid: string): Promise<ChatSession[]> {
  try {
    const snap = await getDocs(userCol(uid, 'chatSessions'));
    return snap.docs.map((d) => d.data() as ChatSession);
  } catch (err) {
    showToast("Couldn't load chat sessions from cloud.");
    return [];
  }
}

// --- Content Bank (legacy) ---

export async function saveContentBankItem(uid: string, item: ContentBankItem): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'contentBank', item.id), JSON.parse(JSON.stringify(item)));
  } catch (err) {
    showToast("Couldn't save content bank item to cloud.");
  }
}

export async function getAllContentBankItems(uid: string): Promise<ContentBankItem[]> {
  try {
    const snap = await getDocs(userCol(uid, 'contentBank'));
    return snap.docs.map((d) => d.data() as ContentBankItem);
  } catch (err) {
    showToast("Couldn't load content bank from cloud.");
    return [];
  }
}

export async function deleteContentBankItem(uid: string, id: string): Promise<void> {
  try {
    await deleteDoc(userDoc(uid, 'contentBank', id));
  } catch (err) {
    showToast("Couldn't delete content bank item from cloud.");
  }
}

// --- Content Pool ---

export async function saveContentPoolEntry(uid: string, entry: ContentPoolEntry): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'contentPool', entry.id), JSON.parse(JSON.stringify(entry)));
  } catch (err) {
    showToast("Couldn't save content pool entry to cloud.");
  }
}

export async function getAllContentPoolEntries(uid: string): Promise<ContentPoolEntry[]> {
  try {
    const snap = await getDocs(userCol(uid, 'contentPool'));
    return snap.docs.map((d) => d.data() as ContentPoolEntry);
  } catch (err) {
    showToast("Couldn't load content pool from cloud.");
    return [];
  }
}

export async function deleteContentPoolEntry(uid: string, id: string): Promise<void> {
  try {
    await deleteDoc(userDoc(uid, 'contentPool', id));
  } catch (err) {
    showToast("Couldn't delete content pool entry from cloud.");
  }
}

// --- Cover Letters ---

export async function saveCoverLetter(uid: string, letter: CoverLetter): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'coverLetters', letter.id), JSON.parse(JSON.stringify(letter)));
  } catch (err) {
    showToast("Couldn't save cover letter to cloud.");
  }
}

export async function getCoverLetter(uid: string, resumeId: string): Promise<CoverLetter | undefined> {
  try {
    const snap = await getDocs(userCol(uid, 'coverLetters'));
    return snap.docs.map((d) => d.data() as CoverLetter).find((l) => l.resumeId === resumeId);
  } catch (err) {
    showToast("Couldn't load cover letter from cloud.");
    return undefined;
  }
}

// --- Job Descriptions ---

export async function saveJobDescription(uid: string, jd: JobDescription): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'jobDescriptions', jd.id), JSON.parse(JSON.stringify(jd)));
  } catch (err) {
    showToast("Couldn't save job description to cloud.");
  }
}

export async function getAllJobDescriptions(uid: string): Promise<JobDescription[]> {
  try {
    const snap = await getDocs(userCol(uid, 'jobDescriptions'));
    return snap.docs.map((d) => d.data() as JobDescription);
  } catch (err) {
    showToast("Couldn't load job descriptions from cloud.");
    return [];
  }
}

export async function deleteJobDescription(uid: string, id: string): Promise<void> {
  try {
    await deleteDoc(userDoc(uid, 'jobDescriptions', id));
  } catch (err) {
    showToast("Couldn't delete job description from cloud.");
  }
}

// --- Recommendations ---

export async function saveRecommendation(uid: string, rec: Recommendation): Promise<void> {
  try {
    await setDoc(userDoc(uid, 'recommendations', rec.id), JSON.parse(JSON.stringify(rec)));
  } catch (err) {
    showToast("Couldn't save recommendation to cloud.");
  }
}

export async function getAllRecommendations(uid: string): Promise<Recommendation[]> {
  try {
    const snap = await getDocs(userCol(uid, 'recommendations'));
    return snap.docs.map((d) => d.data() as Recommendation);
  } catch (err) {
    showToast("Couldn't load recommendations from cloud.");
    return [];
  }
}

export async function deleteRecommendation(uid: string, id: string): Promise<void> {
  try {
    await deleteDoc(userDoc(uid, 'recommendations', id));
  } catch (err) {
    showToast("Couldn't delete recommendation from cloud.");
  }
}

export async function clearRecommendations(uid: string): Promise<void> {
  try {
    const snap = await getDocs(userCol(uid, 'recommendations'));
    if (snap.empty) return;
    const batch = writeBatch(db!);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    showToast("Couldn't clear recommendations from cloud.");
  }
}
