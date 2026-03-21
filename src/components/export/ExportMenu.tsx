import { useState, useRef, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { useAppStore } from '../../stores/useAppStore';
import { PdfDocument } from './PdfDocument';
import { exportToWord } from './WordExporter';

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const activeResume = resumes.find((r) => r.id === activeResumeId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeResume) return null;

  const handlePdfExport = async () => {
    setExporting(true);
    setOpen(false);
    try {
      const blob = await pdf(<PdfDocument resume={activeResume} />).toBlob();
      const fileName = `${activeResume.name.replace(/\s+/g, '_')}.pdf`;
      saveAs(blob, fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleWordExport = async () => {
    setExporting(true);
    setOpen(false);
    try {
      await exportToWord(activeResume);
    } catch (err) {
      console.error('Word export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Export'}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          <button
            onClick={handlePdfExport}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
          >
            Download PDF
          </button>
          <button
            onClick={handleWordExport}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg"
          >
            Download Word
          </button>
        </div>
      )}
    </div>
  );
}
