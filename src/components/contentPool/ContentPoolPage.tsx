import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { generateId } from '../../utils/id';
import { ModeToggle } from '../chat/ModeToggle';
import { JobDescriptionInput } from '../chat/JobDescriptionInput';
import type { ContentPoolEntry, ContentPoolItemData, ContentPoolItemType } from '../../types/resume';

const SECTION_ORDER: ContentPoolItemType[] = [
  'summary', 'bullet', 'education', 'skill_category', 'project', 'certification',
];

const SECTION_LABELS: Record<ContentPoolItemType, string> = {
  contact: 'Contact',
  summary: 'Summary',
  bullet: 'Experience',
  education: 'Education',
  skill_category: 'Skills',
  project: 'Projects',
  certification: 'Certifications',
};

function getItemSummary(item: ContentPoolItemData): string {
  switch (item.type) {
    case 'contact':
      return `${item.data.fullName} | ${item.data.email} | ${item.data.location}`;
    case 'summary':
      return item.data.text.slice(0, 120) + (item.data.text.length > 120 ? '...' : '');
    case 'bullet':
      return item.data.text;
    case 'education':
      return `${item.data.degree} ${item.data.field} — ${item.data.institution}`;
    case 'skill_category':
      return `${item.data.name}: ${item.data.skills.join(', ')}`;
    case 'project':
      return `${item.data.name} — ${item.data.description.slice(0, 80)}`;
    case 'certification':
      return `${item.data.name} — ${item.data.issuer}`;
  }
}

interface JobGroup {
  label: string;
  dateLabel: string;
  context: { company: string; title: string; location: string; startDate: string; endDate: string | null };
  entries: ContentPoolEntry[];
}

function groupBulletsByJob(bullets: ContentPoolEntry[]): Map<string, JobGroup> {
  const groups = new Map<string, JobGroup>();
  for (const entry of bullets) {
    if (entry.item.type !== 'bullet') continue;
    const ctx = entry.item.context;
    const key = `${ctx.company}|${ctx.title}`;
    if (!groups.has(key)) {
      groups.set(key, {
        label: `${ctx.title} @ ${ctx.company}`,
        dateLabel: `${ctx.startDate}–${ctx.endDate ?? 'Present'}`,
        context: ctx,
        entries: [],
      });
    }
    groups.get(key)!.entries.push(entry);
  }
  return groups;
}

// --- Inline "add bullet to existing job" form ---
function AddBulletToJobForm({ context, onAdd }: {
  context: { company: string; title: string; location: string; startDate: string; endDate: string | null };
  onAdd: (entry: ContentPoolEntry) => void;
}) {
  const [bullet, setBullet] = useState('');

  const handleSubmit = () => {
    if (!bullet.trim()) return;
    const now = new Date().toISOString();
    onAdd({
      id: generateId(),
      item: {
        type: 'bullet',
        data: { text: bullet.trim() },
        context: { ...context },
      },
      source: 'user',
      createdAt: now,
      updatedAt: now,
    });
    setBullet('');
  };

  return (
    <div className="flex gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-700">
      <input
        value={bullet}
        onChange={(e) => setBullet(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="New bullet point..."
        className="flex-1 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
        autoFocus
      />
      <button onClick={handleSubmit} disabled={!bullet.trim()} className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
    </div>
  );
}

// --- "New job" form (company + title, optionally first bullet) ---
function AddNewJobForm({ onAdd }: { onAdd: (entry: ContentPoolEntry) => void }) {
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [bullet, setBullet] = useState('');

  const handleSubmit = () => {
    if (!company.trim() || !title.trim()) return;
    const now = new Date().toISOString();
    const context = { company: company.trim(), title: title.trim(), location: '', startDate: startDate.trim(), endDate: null };

    // If they provided a bullet, add it. Otherwise create a placeholder bullet so the job shows up.
    const bulletText = bullet.trim() || `Worked as ${title.trim()} at ${company.trim()}`;
    onAdd({
      id: generateId(),
      item: { type: 'bullet', data: { text: bulletText }, context },
      source: 'user',
      createdAt: now,
      updatedAt: now,
    });
    setCompany('');
    setTitle('');
    setStartDate('');
    setBullet('');
  };

  return (
    <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600">
      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">New job</p>
      <div className="flex gap-2">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="flex-1 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className="flex-1 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white" />
      </div>
      <div className="flex gap-2">
        <input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date (e.g. 2020)" className="w-32 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white" />
        <input value={bullet} onChange={(e) => setBullet(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="First bullet (optional)" className="flex-1 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white" />
        <button onClick={handleSubmit} disabled={!company.trim() || !title.trim()} className="text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
      </div>
    </div>
  );
}

function AddSimpleForm({ type, onAdd }: { type: ContentPoolItemType; onAdd: (entry: ContentPoolEntry) => void }) {
  const [text, setText] = useState('');
  const [text2, setText2] = useState('');

  const placeholders: Record<string, [string, string?]> = {
    summary: ['Professional summary...'],
    education: ['Degree + Field (e.g. BS Computer Science)', 'Institution (e.g. MIT)'],
    skill_category: ['Category name (e.g. Languages)', 'Skills comma-separated (e.g. TypeScript, Python)'],
    project: ['Project name', 'Description'],
    certification: ['Certification name', 'Issuer'],
  };

  const [p1, p2] = placeholders[type] || ['Text...'];

  const handleSubmit = () => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    let item: ContentPoolItemData;

    switch (type) {
      case 'summary':
        item = { type: 'summary', data: { text: text.trim() } };
        break;
      case 'education':
        item = { type: 'education', data: { id: generateId(), institution: text2.trim(), degree: text.trim().split(' ')[0] || text.trim(), field: text.trim().split(' ').slice(1).join(' ') || '', dateRange: { start: '', end: null } } };
        break;
      case 'skill_category':
        item = { type: 'skill_category', data: { id: generateId(), name: text.trim(), skills: text2.split(',').map((s) => s.trim()).filter(Boolean) } };
        break;
      case 'project':
        item = { type: 'project', data: { id: generateId(), name: text.trim(), description: text2.trim(), technologies: [], bullets: [] } };
        break;
      case 'certification':
        item = { type: 'certification', data: { id: generateId(), name: text.trim(), issuer: text2.trim(), date: '' } };
        break;
      default:
        return;
    }

    onAdd({ id: generateId(), item, source: 'user', createdAt: now, updatedAt: now });
    setText('');
    setText2('');
  };

  return (
    <div className="flex gap-2 p-2 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600">
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder={p1} className="flex-1 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white" />
      {p2 && <input value={text2} onChange={(e) => setText2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder={p2} className="flex-1 text-xs border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-white" />}
      <button onClick={handleSubmit} disabled={!text.trim()} className="text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
    </div>
  );
}

// --- Check if a pool entry's content is in the active resume ---
function isEntryInResume(entry: ContentPoolEntry, sections: Array<{ content: { type: string; data: unknown } }>): boolean {
  const item = entry.item;
  if (item.type === 'bullet') {
    const expSection = sections.find((s) => s.content.type === 'experience');
    if (!expSection) return false;
    const expData = expSection.content.data as { items?: Array<{ company: string; title: string; bullets: string[] }> };
    const job = (expData.items || []).find((e) => e.company === item.context.company && e.title === item.context.title);
    return job ? job.bullets.includes(item.data.text) : false;
  }
  if (item.type === 'summary') {
    const sec = sections.find((s) => s.content.type === 'summary');
    return sec ? (sec.content.data as { text: string }).text === item.data.text : false;
  }
  if (item.type === 'education') {
    const sec = sections.find((s) => s.content.type === 'education');
    if (!sec) return false;
    const items = (sec.content.data as { items?: Array<{ institution: string; degree: string }> }).items || [];
    return items.some((i) => i.institution === item.data.institution && i.degree === item.data.degree);
  }
  if (item.type === 'skill_category') {
    const sec = sections.find((s) => s.content.type === 'skills');
    if (!sec) return false;
    const cats = (sec.content.data as { categories?: Array<{ name: string }> }).categories || [];
    return cats.some((c) => c.name === item.data.name);
  }
  if (item.type === 'project') {
    const sec = sections.find((s) => s.content.type === 'projects');
    if (!sec) return false;
    const items = (sec.content.data as { items?: Array<{ name: string }> }).items || [];
    return items.some((i) => i.name === item.data.name);
  }
  if (item.type === 'certification') {
    const sec = sections.find((s) => s.content.type === 'certifications');
    if (!sec) return false;
    const items = (sec.content.data as { items?: Array<{ name: string }> }).items || [];
    return items.some((i) => i.name === item.data.name);
  }
  return false;
}

// --- Editable text (click to edit, blur/Enter to save) ---
function EditableText({ text, onSave, className }: { text: string; onSave: (newText: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  const textRef = useRef<HTMLParagraphElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      // Reset height then set to scrollHeight to fit all content
      const ta = textareaRef.current;
      ta.style.height = '0px';
      ta.style.height = `${Math.max(ta.scrollHeight, 24)}px`;
    }
  }, [editing]);

  if (!editing) {
    return (
      <p
        ref={textRef}
        onClick={() => { setEditing(true); setValue(text); }}
        className={`cursor-text hover:bg-stone-100 dark:hover:bg-stone-700 rounded px-1 -mx-1 ${className ?? ''}`}
        title="Click to edit"
      >
        {text}
      </p>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        // Auto-resize to fit content
        e.target.style.height = '0px';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onBlur={() => { if (value.trim() && value !== text) onSave(value.trim()); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim() && value !== text) onSave(value.trim()); setEditing(false); }
        if (e.key === 'Escape') { setValue(text); setEditing(false); }
      }}
      autoFocus
      className="flex-1 text-sm border border-primary-300 dark:border-primary-600 rounded px-1 py-0 bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 -mx-1 resize-none overflow-hidden"
    />
  );
}

// --- Job Group Card (with inline add bullet + checkboxes + editable) ---
function JobGroupCard({ group, onAdd, onRemove, onToggle, onUpdate, resumeSections }: {
  group: JobGroup;
  onAdd: (entry: ContentPoolEntry) => void;
  onRemove: (id: string) => void;
  onToggle: (entry: ContentPoolEntry, isChecked: boolean) => void;
  onUpdate: (entry: ContentPoolEntry) => void;
  resumeSections: Array<{ content: { type: string; data: unknown } }> | null;
}) {
  const [addingBullet, setAddingBullet] = useState(false);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div className="px-3 py-2 bg-stone-50 dark:bg-stone-700 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-900 dark:text-white">{group.label}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{group.dateLabel}</p>
        </div>
        <button
          onClick={() => setAddingBullet(!addingBullet)}
          className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
        >
          {addingBullet ? 'Cancel' : '+ Bullet'}
        </button>
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-700">
        {group.entries.map((entry) => {
          const isChecked = resumeSections ? isEntryInResume(entry, resumeSections) : false;
          return (
            <div key={entry.id} className="flex items-start gap-3 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(entry, isChecked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              />
              <EditableText
                text={entry.item.type === 'bullet' ? entry.item.data.text : getItemSummary(entry.item)}
                onSave={(newText) => {
                  if (entry.item.type === 'bullet') {
                    onUpdate({ ...entry, item: { ...entry.item, data: { text: newText } }, updatedAt: new Date().toISOString() });
                  }
                }}
                className="flex-1 text-sm text-stone-700 dark:text-stone-300"
              />
              <button onClick={() => onRemove(entry.id)} className="p-1 text-stone-300 hover:text-rose-500 dark:text-stone-600 dark:hover:text-rose-400 transition-colors flex-shrink-0" title="Remove from pool">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}
      </div>
      {addingBullet && (
        <AddBulletToJobForm
          context={group.context}
          onAdd={(entry) => { onAdd(entry); }}
        />
      )}
    </div>
  );
}

// --- Main Component ---

export function ContentPoolPage() {
  const contentPool = useAppStore((s) => s.contentPool);
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const addPoolEntry = useAppStore((s) => s.addPoolEntry);
  const removePoolEntry = useAppStore((s) => s.removePoolEntry);
  const updatePoolEntry = useAppStore((s) => s.updatePoolEntry);
  const addPoolItemToResume = useAppStore((s) => s.addPoolItemToResume);
  const removePoolItemFromResume = useAppStore((s) => s.removePoolItemFromResume);
  const [addingSection, setAddingSection] = useState<ContentPoolItemType | null>(null);

  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const resumeSections = activeResume?.sections ?? null;
  const apiKey = useAppStore((s) => s.apiKey);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);
  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId);
  const isJobMode = activeSession?.mode === 'job-customisation';

  const handleToggle = useCallback((entry: ContentPoolEntry, isChecked: boolean) => {
    if (!activeResumeId) return;
    if (isChecked) {
      removePoolItemFromResume(entry.id, activeResumeId);
    } else {
      addPoolItemToResume(entry.id, activeResumeId);
    }
  }, [activeResumeId, addPoolItemToResume, removePoolItemFromResume]);

  const handleAdd = useCallback((entry: ContentPoolEntry) => {
    addPoolEntry(entry);
  }, [addPoolEntry]);

  const handleAddAndClose = useCallback((entry: ContentPoolEntry) => {
    addPoolEntry(entry);
    setAddingSection(null);
  }, [addPoolEntry]);

  // Group entries by section type
  const grouped = new Map<ContentPoolItemType, ContentPoolEntry[]>();
  for (const entry of contentPool) {
    const type = entry.item.type;
    if (!grouped.has(type)) grouped.set(type, []);
    grouped.get(type)!.push(entry);
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-stone-50 dark:bg-stone-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-4">
          <h2 className="text-sm font-display font-semibold text-stone-900 dark:text-white">CV Content Pool</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {contentPool.length === 0
              ? 'Upload a resume or add items manually. Pick items for each resume version.'
              : 'Check items to include in the current resume version.'}
          </p>
        </div>

        {/* Mode toggle + Generate Recommendations */}
        <div className="space-y-3">
          {apiKey && (
            <div className="flex items-center justify-between">
              <ModeToggle />
              {contentPool.length > 0 && (
                <button
                  className="py-1.5 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                  title="AI will analyze your resume and suggest improvements"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Generate Recommendations
                </button>
              )}
            </div>
          )}

          {/* Job Description input when in Job Match mode */}
          {isJobMode && (
            <JobDescriptionInput onSubmit={() => { /* TODO: wire to AI analysis */ }} />
          )}
        </div>

        {SECTION_ORDER.map((sectionType) => {
          const entries = grouped.get(sectionType) || [];

          return (
            <div key={sectionType}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {SECTION_LABELS[sectionType]}
                  {entries.length > 0 && <span className="ml-1 text-stone-400 dark:text-stone-500 normal-case font-normal">({entries.length})</span>}
                </h3>
                <button
                  onClick={() => setAddingSection(addingSection === sectionType ? null : sectionType)}
                  className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-0.5"
                >
                  {addingSection === sectionType ? 'Cancel' : sectionType === 'bullet' ? '+ New Job' : '+ Add'}
                </button>
              </div>

              {/* Add form — "New Job" for experience, simple form for others */}
              {addingSection === sectionType && (
                <div className="mb-2">
                  {sectionType === 'bullet' ? (
                    <AddNewJobForm onAdd={handleAddAndClose} />
                  ) : (
                    <AddSimpleForm type={sectionType} onAdd={handleAddAndClose} />
                  )}
                </div>
              )}

              {/* Bullet section — grouped by job, each with inline "+ Bullet" */}
              {sectionType === 'bullet' && entries.length > 0 && (
                <div className="space-y-4">
                  {Array.from(groupBulletsByJob(entries).entries()).map(([key, group]) => (
                    <JobGroupCard key={key} group={group} onAdd={handleAdd} onRemove={removePoolEntry} onToggle={handleToggle} onUpdate={updatePoolEntry} resumeSections={resumeSections} />
                  ))}
                </div>
              )}

              {/* Non-bullet sections — flat list with checkboxes */}
              {sectionType !== 'bullet' && entries.length > 0 && (
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const isChecked = resumeSections ? isEntryInResume(entry, resumeSections) : false;
                    return (
                      <div key={entry.id} className={`bg-white dark:bg-stone-800 rounded-lg border p-3 transition-colors ${isChecked ? 'border-primary-300 dark:border-primary-600' : 'border-stone-200 dark:border-stone-700'}`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(entry, isChecked)}
                            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                          />
                          {entry.item.type === 'summary' ? (
                            <EditableText
                              text={entry.item.data.text}
                              onSave={(newText) => updatePoolEntry({ ...entry, item: { type: 'summary', data: { text: newText } }, updatedAt: new Date().toISOString() })}
                              className="flex-1 text-sm text-stone-900 dark:text-white min-w-0"
                            />
                          ) : (
                            <p className="flex-1 text-sm text-stone-900 dark:text-white min-w-0">{getItemSummary(entry.item)}</p>
                          )}
                          <button onClick={() => removePoolEntry(entry.id)} className="p-1 text-stone-300 hover:text-rose-500 dark:text-stone-600 dark:hover:text-rose-400 transition-colors" title="Remove from pool">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state for section */}
              {entries.length === 0 && addingSection !== sectionType && (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">No items yet</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
