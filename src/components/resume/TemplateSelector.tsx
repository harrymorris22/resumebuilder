import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { TemplateId } from '../../types/resume';

const templates: Array<{ id: TemplateId; name: string; desc: string }> = [
  { id: 'classic', name: 'Classic', desc: 'Traditional serif layout' },
  { id: 'modern', name: 'Modern', desc: 'Color accent header' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean & simple' },
  { id: 'creative', name: 'Creative', desc: 'Two-column with timeline' },
];

export function TemplateSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const updateResume = useAppStore((s) => s.updateResume);
  const activeResume = resumes.find((r) => r.id === activeResumeId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeResume) return null;

  const handleSelect = (id: TemplateId) => {
    updateResume({ ...activeResume, templateId: id, updatedAt: new Date().toISOString() });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 transition-colors"
      >
        Template: {templates.find((t) => t.id === activeResume.templateId)?.name}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-50 p-2">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`p-2 rounded-md text-left transition-colors ${
                  activeResume.templateId === t.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500'
                    : 'border-2 border-stone-100 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-500'
                }`}
              >
                {/* Mini preview placeholder */}
                <div className="h-12 bg-stone-50 dark:bg-stone-700 rounded mb-1 flex items-center justify-center">
                  <span className="text-[8px] text-stone-400">{t.name}</span>
                </div>
                <div className="text-xs font-medium text-stone-900 dark:text-white">{t.name}</div>
                <div className="text-[10px] text-stone-400">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
