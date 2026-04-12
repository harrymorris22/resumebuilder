import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Resume } from '../types/resume';


// --- Firestore SDK mocks ---
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDeleteDoc = vi.fn();
const mockWriteBatch = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
}));

vi.mock('../config/firebase', () => ({
  db: { __mock: true },
}));

import {
  saveResume,
  getResume,
  getAllResumes,
  deleteResume,
  clearRecommendations,
} from './firestoreDb';

describe('firestoreDb', () => {
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockCollection.mockReturnValue('mock-col-ref');
  });

  const fakeResume: Resume = {
    id: 'r1',
    title: 'My Resume',
    template: 'classic',
    sections: [],
    contact: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '555-0100',
      location: 'NYC',
    },
    sectionOrder: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as unknown as Resume;

  // --- saveResume ---

  describe('saveResume', () => {
    it('calls setDoc with a deep-cloned resume', async () => {
      mockSetDoc.mockResolvedValue(undefined);

      await saveResume('uid1', fakeResume);

      expect(mockDoc).toHaveBeenCalledWith(
        { __mock: true },
        'users',
        'uid1',
        'resumes',
        'r1',
      );
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      // Verify JSON round-trip (strips non-serializable data)
      const passedData = mockSetDoc.mock.calls[0][1];
      expect(passedData).toEqual(JSON.parse(JSON.stringify(fakeResume)));
    });

    it('dispatches firestore-error event on failure', async () => {
      mockSetDoc.mockRejectedValue(new Error('network'));

      await saveResume('uid1', fakeResume);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('firestore-error');
      expect(event.detail).toContain('save resume');
    });
  });

  // --- getResume ---

  describe('getResume', () => {
    it('returns resume data when document exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => fakeResume,
      });

      const result = await getResume('uid1', 'r1');

      expect(mockDoc).toHaveBeenCalledWith(
        { __mock: true },
        'users',
        'uid1',
        'resumes',
        'r1',
      );
      expect(result).toEqual(fakeResume);
    });

    it('returns undefined when document does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      });

      const result = await getResume('uid1', 'nonexistent');

      expect(result).toBeUndefined();
    });

    it('returns undefined and dispatches error on failure', async () => {
      mockGetDoc.mockRejectedValue(new Error('offline'));

      const result = await getResume('uid1', 'r1');

      expect(result).toBeUndefined();
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('firestore-error');
      expect(event.detail).toContain('load resume');
    });
  });

  // --- getAllResumes ---

  describe('getAllResumes', () => {
    it('returns all resumes from the collection', async () => {
      const resume2 = { ...fakeResume, id: 'r2' };
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => fakeResume },
          { data: () => resume2 },
        ],
      });

      const result = await getAllResumes('uid1');

      expect(mockCollection).toHaveBeenCalledWith(
        { __mock: true },
        'users',
        'uid1',
        'resumes',
      );
      expect(result).toEqual([fakeResume, resume2]);
    });

    it('returns empty array and dispatches error on failure', async () => {
      mockGetDocs.mockRejectedValue(new Error('quota'));

      const result = await getAllResumes('uid1');

      expect(result).toEqual([]);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('firestore-error');
      expect(event.detail).toContain('load resumes');
    });
  });

  // --- deleteResume ---

  describe('deleteResume', () => {
    it('calls deleteDoc with the correct document reference', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteResume('uid1', 'r1');

      expect(mockDoc).toHaveBeenCalledWith(
        { __mock: true },
        'users',
        'uid1',
        'resumes',
        'r1',
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('dispatches error on failure and does not throw', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('permission'));

      await expect(deleteResume('uid1', 'r1')).resolves.toBeUndefined();

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('firestore-error');
      expect(event.detail).toContain('delete resume');
    });
  });

  // --- clearRecommendations ---

  describe('clearRecommendations', () => {
    it('batch-deletes all recommendation docs', async () => {
      const mockBatchDelete = vi.fn();
      const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
      mockWriteBatch.mockReturnValue({
        delete: mockBatchDelete,
        commit: mockBatchCommit,
      });

      const docRef1 = { id: 'rec1' };
      const docRef2 = { id: 'rec2' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [
          { ref: docRef1, data: () => ({}) },
          { ref: docRef2, data: () => ({}) },
        ],
      });

      await clearRecommendations('uid1');

      expect(mockWriteBatch).toHaveBeenCalledWith({ __mock: true });
      expect(mockBatchDelete).toHaveBeenCalledTimes(2);
      expect(mockBatchDelete).toHaveBeenCalledWith(docRef1);
      expect(mockBatchDelete).toHaveBeenCalledWith(docRef2);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it('returns early when the collection is empty', async () => {
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      await clearRecommendations('uid1');

      expect(mockWriteBatch).not.toHaveBeenCalled();
    });

    it('dispatches error on failure and does not throw', async () => {
      mockGetDocs.mockRejectedValue(new Error('unavailable'));

      await expect(clearRecommendations('uid1')).resolves.toBeUndefined();

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('firestore-error');
      expect(event.detail).toContain('clear recommendations');
    });
  });
});
