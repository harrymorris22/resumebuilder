import { useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { generateId } from '../../utils/id';
import type { ContentPoolEntry, ContactInfo } from '../../types/resume';

const FIELDS: { key: keyof ContactInfo; label: string; placeholder: string; half?: boolean }[] = [
  { key: 'fullName', label: 'Full Name', placeholder: 'Jane Smith', half: true },
  { key: 'email', label: 'Email', placeholder: 'jane@example.com', half: true },
  { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567', half: true },
  { key: 'location', label: 'Location', placeholder: 'London, UK', half: true },
  { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/janesmith' },
  { key: 'github', label: 'GitHub URL', placeholder: 'github.com/janesmith' },
  { key: 'website', label: 'Portfolio / Website', placeholder: 'janesmith.dev' },
];

export function ContactInfoForm() {
  const contentPool = useAppStore((s) => s.contentPool);
  const addPoolEntry = useAppStore((s) => s.addPoolEntry);
  const updatePoolEntry = useAppStore((s) => s.updatePoolEntry);
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);
  const updateResume = useAppStore((s) => s.updateResume);

  const contactEntry = contentPool.find((e) => e.item.type === 'contact') as
    | (ContentPoolEntry & { item: { type: 'contact'; data: ContactInfo } })
    | undefined;

  const contactData: ContactInfo = contactEntry?.item.data ?? {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  };

  const syncToResume = useCallback(
    (data: ContactInfo) => {
      // Sync to both active resume and generated resume (if different)
      const targetIds = new Set<string>();
      if (activeResumeId) targetIds.add(activeResumeId);
      if (generatedResumeId) targetIds.add(generatedResumeId);

      for (const resumeId of targetIds) {
        const resume = resumes.find((r) => r.id === resumeId);
        if (!resume) continue;

        const contactSection = resume.sections.find((s) => s.content.type === 'contact');
        if (!contactSection) continue;

        updateResume({
          ...resume,
          sections: resume.sections.map((s) =>
            s.id === contactSection.id
              ? { ...s, content: { type: 'contact' as const, data: { ...data } } }
              : s
          ),
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [resumes, activeResumeId, generatedResumeId, updateResume]
  );

  const handleChange = useCallback(
    (field: keyof ContactInfo, value: string) => {
      const now = new Date().toISOString();
      const updated: ContactInfo = { ...contactData, [field]: value };

      if (contactEntry) {
        updatePoolEntry({
          ...contactEntry,
          item: { type: 'contact', data: updated },
          updatedAt: now,
        });
      } else {
        addPoolEntry({
          id: generateId(),
          item: { type: 'contact', data: updated },
          source: 'user',
          createdAt: now,
          updatedAt: now,
        });
      }

      syncToResume(updated);
    },
    [contactData, contactEntry, updatePoolEntry, addPoolEntry, syncToResume]
  );

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
        Personal Details
      </h3>
      <div className="border border-stone-200 rounded-md p-4 bg-white space-y-3">
        {/* Core fields: 2-col grid */}
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.filter((f) => f.half).map((f) => (
            <label key={f.key} className="block">
              <span className="text-[11px] font-medium text-stone-500 mb-1 block">{f.label}</span>
              <input
                type="text"
                value={contactData[f.key] ?? ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full text-sm border border-stone-200 rounded px-2.5 py-1.5 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </label>
          ))}
        </div>
        {/* URL fields: single column */}
        {FIELDS.filter((f) => !f.half).map((f) => (
          <label key={f.key} className="block">
            <span className="text-[11px] font-medium text-stone-500 mb-1 block">{f.label}</span>
            <input
              type="text"
              value={contactData[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full text-sm border border-stone-200 rounded px-2.5 py-1.5 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
