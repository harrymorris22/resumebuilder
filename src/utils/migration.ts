/**
 * One-time migration: copies all data from IndexedDB (local) to Firestore (cloud).
 * Used when a user with existing local data signs in for the first time.
 */
import * as idb from '../db/indexedDb';
import * as firestore from '../db/firestoreDb';

const MIGRATION_KEY_PREFIX = 'migration-done-';

/** Check if migration has already been completed for this user. */
export function isMigrationDone(uid: string): boolean {
  try {
    return localStorage.getItem(`${MIGRATION_KEY_PREFIX}${uid}`) === 'true';
  } catch {
    return false;
  }
}

/** Mark migration as completed for this user. */
export function markMigrationDone(uid: string): void {
  try {
    localStorage.setItem(`${MIGRATION_KEY_PREFIX}${uid}`, 'true');
  } catch {
    // localStorage unavailable, migration may re-prompt
  }
}

/** Check if there's meaningful local data in IndexedDB worth migrating. */
export async function hasLocalData(): Promise<boolean> {
  const [resumes, contentPool, chatSessions, jobDescriptions] = await Promise.all([
    idb.getAllResumes(),
    idb.getAllContentPoolEntries(),
    idb.getAllChatSessions(),
    idb.getAllJobDescriptions(),
  ]);

  // A single empty default resume doesn't count as "meaningful" data
  const hasMeaningfulResumes = resumes.length > 1 || (
    resumes.length === 1 && resumes[0].sections.some((s) => {
      if (s.content.type === 'contact') {
        const d = s.content.data as { fullName?: string };
        return !!d.fullName;
      }
      if (s.content.type === 'experience') {
        const d = s.content.data as { items?: unknown[] };
        return (d.items?.length ?? 0) > 0;
      }
      return false;
    })
  );

  return hasMeaningfulResumes || contentPool.length > 0 || chatSessions.length > 0 || jobDescriptions.length > 0;
}

/** Check if the user's Firestore account is empty (new account). */
export async function isFirestoreEmpty(uid: string): Promise<boolean> {
  const [resumes, contentPool] = await Promise.all([
    firestore.getAllResumes(uid),
    firestore.getAllContentPoolEntries(uid),
  ]);
  return resumes.length === 0 && contentPool.length === 0;
}

export interface MigrationResult {
  resumes: number;
  contentPool: number;
  chatSessions: number;
  contentBankItems: number;
  coverLetters: number;
  jobDescriptions: number;
  recommendations: number;
}

/** Copy all data from IndexedDB to Firestore for the given user. */
export async function migrateIdbToFirestore(uid: string): Promise<MigrationResult> {
  // Read everything from IDB
  const [resumes, contentPool, chatSessions, contentBankItems, jobDescriptions, recommendations] = await Promise.all([
    idb.getAllResumes(),
    idb.getAllContentPoolEntries(),
    idb.getAllChatSessions(),
    idb.getAllContentBankItems(),
    idb.getAllJobDescriptions(),
    idb.getAllRecommendations(),
  ]);

  // Write everything to Firestore (fire all writes in parallel)
  const writes: Promise<void>[] = [];

  for (const resume of resumes) {
    writes.push(firestore.saveResume(uid, resume));
  }
  for (const entry of contentPool) {
    writes.push(firestore.saveContentPoolEntry(uid, entry));
  }
  for (const session of chatSessions) {
    writes.push(firestore.saveChatSession(uid, session));
  }
  for (const item of contentBankItems) {
    writes.push(firestore.saveContentBankItem(uid, item));
  }
  for (const jd of jobDescriptions) {
    writes.push(firestore.saveJobDescription(uid, jd));
  }
  for (const rec of recommendations) {
    writes.push(firestore.saveRecommendation(uid, rec));
  }

  // Note: cover letters are queried by resumeId, not getAllCoverLetters.
  // We read them per-resume.
  let coverLetterCount = 0;
  for (const resume of resumes) {
    const letter = await idb.getCoverLetter(resume.id);
    if (letter) {
      writes.push(firestore.saveCoverLetter(uid, letter));
      coverLetterCount++;
    }
  }

  await Promise.all(writes);

  markMigrationDone(uid);

  return {
    resumes: resumes.length,
    contentPool: contentPool.length,
    chatSessions: chatSessions.length,
    contentBankItems: contentBankItems.length,
    coverLetters: coverLetterCount,
    jobDescriptions: jobDescriptions.length,
    recommendations: recommendations.length,
  };
}
