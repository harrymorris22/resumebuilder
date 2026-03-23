import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { createDefaultResume } from '../../utils/resumeDefaults';

export function ResumeMenu() {
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const setActiveResumeId = useAppStore((s) => s.setActiveResumeId);
  const addResume = useAppStore((s) => s.addResume);
  const removeResume = useAppStore((s) => s.removeResume);
  const duplicateResume = useAppStore((s) => s.duplicateResume);
  const renameResume = useAppStore((s) => s.renameResume);

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setRenaming(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus rename input
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const handleSelect = useCallback((id: string) => {
    setActiveResumeId(id);
    setOpen(false);
    setRenaming(false);
    setConfirmDelete(false);
  }, [setActiveResumeId]);

  const handleNewBlank = useCallback(() => {
    const r = createDefaultResume();
    r.name = 'Untitled Resume';
    addResume(r);
    setActiveResumeId(r.id);
    setOpen(false);
  }, [addResume, setActiveResumeId]);

  const handleDuplicate = useCallback(() => {
    if (activeResumeId) {
      duplicateResume(activeResumeId);
      setOpen(false);
    }
  }, [activeResumeId, duplicateResume]);

  const handleStartRename = useCallback(() => {
    setRenameValue(activeResume?.name ?? '');
    setRenaming(true);
    setConfirmDelete(false);
  }, [activeResume]);

  const handleRenameSubmit = useCallback(() => {
    if (activeResumeId && renameValue.trim()) {
      renameResume(activeResumeId, renameValue);
    }
    setRenaming(false);
  }, [activeResumeId, renameValue, renameResume]);

  const handleDelete = useCallback(() => {
    if (activeResumeId) {
      removeResume(activeResumeId);
      setConfirmDelete(false);
      setOpen(false);
    }
  }, [activeResumeId, removeResume]);

  if (resumes.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen(!open); setRenaming(false); setConfirmDelete(false); }}
        className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md px-2.5 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="max-w-[180px] truncate">{activeResume?.name ?? 'Select'}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 py-1">
          {/* Resume list */}
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                r.id === activeResumeId ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {r.id === activeResumeId && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {r.id !== activeResumeId && <span className="w-3.5" />}
              <span className="truncate">{r.name}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600 my-1" />

          {/* Actions */}
          <button onClick={handleNewBlank} className="w-full text-left px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New blank resume
          </button>

          <button onClick={handleDuplicate} className="w-full text-left px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Duplicate current
          </button>

          {/* Rename */}
          {renaming ? (
            <div className="px-3 py-1.5">
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                onBlur={handleRenameSubmit}
                className="w-full text-sm border border-gray-300 dark:border-gray-500 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ) : (
            <button onClick={handleStartRename} className="w-full text-left px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Rename
            </button>
          )}

          {/* Delete */}
          {confirmDelete ? (
            <div className="px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs text-rose-600 dark:text-rose-400">Delete?</span>
              <button onClick={handleDelete} className="text-xs text-white bg-rose-500 hover:bg-rose-600 rounded px-2 py-0.5">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={resumes.length <= 1}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                resumes.length <= 1
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-rose-500 dark:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
