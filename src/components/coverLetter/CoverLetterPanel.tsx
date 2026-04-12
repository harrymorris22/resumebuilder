import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useGenerateCoverLetter } from '../../hooks/useGenerateCoverLetter';
import { exportCoverLetterToWord } from '../export/WordExporter';
import type { CoverLetterTone } from '../../types/resume';

const TONES: { value: CoverLetterTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
];

export function CoverLetterPanel() {
  const activeCoverLetter = useAppStore((s) => s.activeCoverLetter);
  const updateCoverLetter = useAppStore((s) => s.updateCoverLetter);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);
  const resumes = useAppStore((s) => s.resumes);

  const { generate, isGenerating, error, abort } = useGenerateCoverLetter();

  const [tone, setTone] = useState<CoverLetterTone>('professional');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const hasPrerequisites = !!generatedResumeId && !!activeJobDescriptionId;

  const activeJd = jobDescriptions.find((j) => j.id === activeJobDescriptionId);
  const activeResume = resumes.find((r) => r.id === generatedResumeId);

  const handleGenerate = useCallback(() => {
    generate(tone);
  }, [generate, tone]);

  const handleCopy = useCallback(async () => {
    if (!activeCoverLetter) return;
    try {
      await navigator.clipboard.writeText(activeCoverLetter.text);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Couldn\u2019t copy. Select text manually.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  }, [activeCoverLetter]);

  const handleWordExport = useCallback(async () => {
    if (!activeCoverLetter || !activeJd) return;
    setExportError(null);
    try {
      const contactSection = activeResume?.sections.find((s) => s.content.type === 'contact');
      const name = contactSection?.content.type === 'contact' ? contactSection.content.data.fullName : 'Applicant';
      await exportCoverLetterToWord(activeCoverLetter.text, name, activeJd.title, activeJd.company);
    } catch {
      setExportError('Export failed. Try again.');
      setTimeout(() => setExportError(null), 3000);
    }
  }, [activeCoverLetter, activeJd, activeResume]);

  const handlePdfExport = useCallback(() => {
    document.body.classList.add('printing-cover-letter');
    window.print();
    document.body.classList.remove('printing-cover-letter');
  }, []);

  const handleStartEdit = useCallback(() => {
    if (!activeCoverLetter) return;
    setEditText(activeCoverLetter.text);
    setIsEditing(true);
  }, [activeCoverLetter]);

  const handleSaveEdit = useCallback(() => {
    if (!activeCoverLetter || !editText.trim()) return;
    updateCoverLetter(activeCoverLetter.id, editText);
    setIsEditing(false);
  }, [activeCoverLetter, editText, updateCoverLetter]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText('');
  }, []);

  // --- No prerequisites ---
  if (!hasPrerequisites) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900">
        <div className="text-center px-8">
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            Generate a resume and select a job description first, then come back here to create a cover letter.
          </p>
        </div>
      </div>
    );
  }

  // --- No cover letter yet ---
  if (!activeCoverLetter) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900">
        <div className="text-center px-8 max-w-sm">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
            Generate a tailored cover letter based on your resume and job description.
          </p>

          {/* Tone selector */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <label className="text-xs text-stone-500 dark:text-stone-400">Tone:</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as CoverLetterTone)}
              disabled={isGenerating}
              className="text-xs px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {isGenerating ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </div>
              <button
                onClick={abort}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              Generate Cover Letter
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Cover letter exists ---
  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-stone-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex-shrink-0">
        <button
          onClick={handleCopy}
          className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors"
        >
          {copyFeedback || 'Copy'}
        </button>
        <span className="text-stone-300 dark:text-stone-600">|</span>
        <button
          onClick={handleWordExport}
          className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors"
        >
          Export Word
        </button>
        <span className="text-stone-300 dark:text-stone-600">|</span>
        <button
          onClick={handlePdfExport}
          className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors"
        >
          Export PDF
        </button>
        <span className="text-stone-300 dark:text-stone-600">|</span>
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleStartEdit}
            className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors"
          >
            Edit
          </button>
        )}

        <div className="flex-1" />

        {/* Tone + Regenerate */}
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as CoverLetterTone)}
          disabled={isGenerating}
          className="text-xs px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="text-xs text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {/* Error/export error banners */}
      {(error || exportError) && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs">
          {error || exportError}
        </div>
      )}

      {/* Document body */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div id="cover-letter-print-area" className="bg-white dark:bg-stone-800 shadow-lg w-full max-w-[8.5in] min-h-[11in] p-12">
          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-full min-h-[9in] font-serif text-sm leading-relaxed text-stone-900 dark:text-stone-100 bg-transparent border-none outline-none resize-none"
              autoFocus
            />
          ) : (
            <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-stone-900 dark:text-stone-100">
              {activeCoverLetter.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
