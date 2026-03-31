import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { extractText, parseResumeWithClaude, extractPoolEntries, deduplicateAgainstPool } from '../../services/resumeParser';

const ACCEPTED = '.pdf,.docx,.doc,.txt';
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

type Status = 'idle' | 'extracting' | 'parsing' | 'success' | 'error';

export function UploadResumeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const apiKey = useAppStore((s) => s.apiKey);
  const addResume = useAppStore((s) => s.addResume);
  const setActiveResumeId = useAppStore((s) => s.setActiveResumeId);
  const addPoolEntry = useAppStore((s) => s.addPoolEntry);
  const contentPool = useAppStore((s) => s.contentPool);

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError('');
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const processFile = useCallback(
    async (file: File) => {
      if (!apiKey) {
        setError('Please set your Anthropic API key in Settings first.');
        setStatus('error');
        return;
      }

      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx?|txt)$/i)) {
        setError('Unsupported file type. Please upload a PDF, Word document, or text file.');
        setStatus('error');
        return;
      }

      try {
        setStatus('extracting');
        const text = await extractText(file);

        if (!text.trim()) {
          setError('Could not extract text from this file. It may be a scanned image — try a text-based PDF or Word document.');
          setStatus('error');
          return;
        }

        setStatus('parsing');
        const resume = await parseResumeWithClaude(text, apiKey);

        addResume(resume);
        setActiveResumeId(resume.id);

        // Populate content pool from parsed resume (deduplicated)
        const poolEntries = extractPoolEntries(resume);
        const uniqueEntries = deduplicateAgainstPool(poolEntries, contentPool);
        for (const entry of uniqueEntries) {
          addPoolEntry(entry);
        }

        setStatus('success');
        setTimeout(handleClose, 800);
      } catch (err) {
        console.error('Resume upload failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to parse resume. Please try again.'
        );
        setStatus('error');
      }
    },
    [apiKey, addResume, setActiveResumeId, handleClose]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  if (!open) return null;

  const isProcessing = status === 'extracting' || status === 'parsing';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Upload Resume"
    >
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            Upload Resume
          </h2>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          Upload a PDF, Word document, or text file. Claude will parse it into editable sections.
        </p>

        {!isProcessing && status !== 'success' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-stone-300 dark:border-stone-600 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
          >
            <svg
              className="w-10 h-10 mx-auto mb-3 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Drop your resume here or click to browse
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              PDF, DOCX, or TXT
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {isProcessing && (
          <div className="py-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {status === 'extracting' ? 'Extracting text...' : 'Parsing resume with Claude...'}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Resume imported successfully!
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-md">
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <button
              onClick={reset}
              className="mt-2 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
