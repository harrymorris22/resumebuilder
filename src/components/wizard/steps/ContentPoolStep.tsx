import { useState } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { ContentPoolPage } from '../../contentPool/ContentPoolPage';
import { UploadResumeModal } from '../../resume/UploadResumeModal';

export function ContentPoolStep() {
  const contentPool = useAppStore((s) => s.contentPool);
  const [showUpload, setShowUpload] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const isEmpty = contentPool.length === 0 && !showManual;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full px-6 py-16">
          <h2
            tabIndex={-1}
            className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2"
          >
            Build Your Content Pool
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 max-w-md text-center">
            Upload an existing CV to auto-extract your experience, or add items manually.
            This is your master library of skills, experience, and education.
          </p>

          <div className="flex gap-4 max-w-lg w-full">
            {/* Upload CV card */}
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="flex-1 flex flex-col items-center gap-3 p-6 border border-stone-200 dark:border-stone-700 rounded-md hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-stone-800 group"
            >
              <div className="w-10 h-10 flex items-center justify-center text-stone-400 group-hover:text-primary-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Upload CV</span>
              <span className="text-xs text-stone-400">PDF or DOCX</span>
            </button>

            {/* Add Manually card */}
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="flex-1 flex flex-col items-center gap-3 p-6 border border-stone-200 dark:border-stone-700 rounded-md hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-stone-800 group"
            >
              <div className="w-10 h-10 flex items-center justify-center text-stone-400 group-hover:text-primary-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Add Manually</span>
              <span className="text-xs text-stone-400">Start from scratch</span>
            </button>
          </div>
        </div>
      ) : (
        <ContentPoolPage />
      )}

      {showUpload && (
        <UploadResumeModal onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}
