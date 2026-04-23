/**
 * Persistence routing layer.
 * Delegates to Firestore (when uid is present) or IndexedDB (when null).
 * Never reads auth.currentUser directly — uid is always passed as a parameter.
 */
import * as idb from './indexedDb';
import * as firestore from './firestoreDb';
import type { Resume, ContentBankItem, ContentPoolEntry, CoverLetter, InterviewQuestions, InterviewPrep, JobDescription } from '../types/resume';
import type { ChatSession } from '../types/chat';
import type { Recommendation } from '../types/recommendation';

// --- Resumes ---

export async function saveResume(uid: string | null, resume: Resume): Promise<void> {
  if (uid) return firestore.saveResume(uid, resume);
  return idb.saveResume(resume);
}

export async function getResume(uid: string | null, id: string): Promise<Resume | undefined> {
  if (uid) return firestore.getResume(uid, id);
  return idb.getResume(id);
}

export async function getAllResumes(uid: string | null): Promise<Resume[]> {
  if (uid) return firestore.getAllResumes(uid);
  return idb.getAllResumes();
}

export async function deleteResume(uid: string | null, id: string): Promise<void> {
  if (uid) return firestore.deleteResume(uid, id);
  return idb.deleteResume(id);
}

// --- Chat Sessions ---

export async function saveChatSession(uid: string | null, session: ChatSession): Promise<void> {
  if (uid) return firestore.saveChatSession(uid, session);
  return idb.saveChatSession(session);
}

export async function getChatSession(uid: string | null, id: string): Promise<ChatSession | undefined> {
  if (uid) return firestore.getChatSession(uid, id);
  return idb.getChatSession(id);
}

export async function getAllChatSessions(uid: string | null): Promise<ChatSession[]> {
  if (uid) return firestore.getAllChatSessions(uid);
  return idb.getAllChatSessions();
}

// --- Content Bank (legacy) ---

export async function saveContentBankItem(uid: string | null, item: ContentBankItem): Promise<void> {
  if (uid) return firestore.saveContentBankItem(uid, item);
  return idb.saveContentBankItem(item);
}

export async function getAllContentBankItems(uid: string | null): Promise<ContentBankItem[]> {
  if (uid) return firestore.getAllContentBankItems(uid);
  return idb.getAllContentBankItems();
}

export async function deleteContentBankItem(uid: string | null, id: string): Promise<void> {
  if (uid) return firestore.deleteContentBankItem(uid, id);
  return idb.deleteContentBankItem(id);
}

// --- Content Pool ---

export async function saveContentPoolEntry(uid: string | null, entry: ContentPoolEntry): Promise<void> {
  if (uid) return firestore.saveContentPoolEntry(uid, entry);
  return idb.saveContentPoolEntry(entry);
}

export async function getAllContentPoolEntries(uid: string | null): Promise<ContentPoolEntry[]> {
  if (uid) return firestore.getAllContentPoolEntries(uid);
  return idb.getAllContentPoolEntries();
}

export async function deleteContentPoolEntry(uid: string | null, id: string): Promise<void> {
  if (uid) return firestore.deleteContentPoolEntry(uid, id);
  return idb.deleteContentPoolEntry(id);
}

// --- Cover Letters ---

export async function saveCoverLetter(uid: string | null, letter: CoverLetter): Promise<void> {
  if (uid) return firestore.saveCoverLetter(uid, letter);
  return idb.saveCoverLetter(letter);
}

export async function getCoverLetter(uid: string | null, resumeId: string): Promise<CoverLetter | undefined> {
  if (uid) return firestore.getCoverLetter(uid, resumeId);
  return idb.getCoverLetter(resumeId);
}

// --- Job Descriptions ---

export async function saveJobDescription(uid: string | null, jd: JobDescription): Promise<void> {
  if (uid) return firestore.saveJobDescription(uid, jd);
  return idb.saveJobDescription(jd);
}

export async function getAllJobDescriptions(uid: string | null): Promise<JobDescription[]> {
  if (uid) return firestore.getAllJobDescriptions(uid);
  return idb.getAllJobDescriptions();
}

export async function deleteJobDescription(uid: string | null, id: string): Promise<void> {
  if (uid) return firestore.deleteJobDescription(uid, id);
  return idb.deleteJobDescription(id);
}

// --- Recommendations ---

export async function saveRecommendation(uid: string | null, rec: Recommendation): Promise<void> {
  if (uid) return firestore.saveRecommendation(uid, rec);
  return idb.saveRecommendation(rec);
}

export async function getAllRecommendations(uid: string | null): Promise<Recommendation[]> {
  if (uid) return firestore.getAllRecommendations(uid);
  return idb.getAllRecommendations();
}

export async function deleteRecommendation(uid: string | null, id: string): Promise<void> {
  if (uid) return firestore.deleteRecommendation(uid, id);
  return idb.deleteRecommendation(id);
}

export async function clearRecommendations(uid: string | null): Promise<void> {
  if (uid) return firestore.clearRecommendations(uid);
  return idb.clearRecommendations();
}

// --- Interview Questions ---

export async function saveInterviewQuestions(uid: string | null, iq: InterviewQuestions): Promise<void> {
  if (uid) return firestore.saveInterviewQuestions(uid, iq);
  return idb.saveInterviewQuestions(iq);
}

export async function getInterviewQuestions(uid: string | null, jobDescriptionId: string): Promise<InterviewQuestions | undefined> {
  if (uid) return firestore.getInterviewQuestions(uid, jobDescriptionId);
  return idb.getInterviewQuestions(jobDescriptionId);
}

export async function getAllInterviewQuestions(uid: string | null): Promise<InterviewQuestions[]> {
  if (uid) return firestore.getAllInterviewQuestions(uid);
  return idb.getAllInterviewQuestions();
}

// --- Interview Prep ---

export async function saveInterviewPrep(uid: string | null, prep: InterviewPrep): Promise<void> {
  if (uid) return firestore.saveInterviewPrep(uid, prep);
  return idb.saveInterviewPrep(prep);
}

export async function getInterviewPrep(uid: string | null): Promise<InterviewPrep | undefined> {
  if (uid) return firestore.getInterviewPrep(uid);
  return idb.getInterviewPrep();
}
