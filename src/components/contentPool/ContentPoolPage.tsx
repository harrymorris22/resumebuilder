import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { generateId } from '../../utils/id';
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
    <div className="flex gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-750">
      <input
        value={bullet}
        onChange={(e) => setBullet(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="New bullet point..."
        className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
    <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">New job</p>
      <div className="flex gap-2">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      </div>
      <div className="flex gap-2">
        <input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date (e.g. 2020)" className="w-32 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <input value={bullet} onChange={(e) => setBullet(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="First bullet (optional)" className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
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
    <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder={p1} className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      {p2 && <input value={text2} onChange={(e) => setText2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder={p2} className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />}
      <button onClick={handleSubmit} disabled={!text.trim()} className="text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
    </div>
  );
}

// --- Job Group Card (with inline add bullet) ---
function JobGroupCard({ group, onAdd, onRemove }: {
  group: JobGroup;
  onAdd: (entry: ContentPoolEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [addingBullet, setAddingBullet] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{group.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{group.dateLabel}</p>
        </div>
        <button
          onClick={() => setAddingBullet(!addingBullet)}
          className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
        >
          {addingBullet ? 'Cancel' : '+ Bullet'}
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {group.entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750">
            <span className="text-gray-300 dark:text-gray-600 mt-0.5 text-xs">•</span>
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{getItemSummary(entry.item)}</p>
            <button onClick={() => onRemove(entry.id)} className="p-1 text-gray-300 hover:text-rose-500 dark:text-gray-600 dark:hover:text-rose-400 transition-colors flex-shrink-0" title="Remove">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      {addingBullet && (
        <AddBulletToJobForm
          context={group.context}
          onAdd={(entry) => { onAdd(entry); /* keep form open for adding more */ }}
        />
      )}
    </div>
  );
}

// --- Main Component ---

export function ContentPoolPage() {
  const contentPool = useAppStore((s) => s.contentPool);
  const addPoolEntry = useAppStore((s) => s.addPoolEntry);
  const removePoolEntry = useAppStore((s) => s.removePoolEntry);
  const [addingSection, setAddingSection] = useState<ContentPoolItemType | null>(null);

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
    <div className="h-full overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">CV Content Pool</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {contentPool.length === 0
              ? 'Upload a resume or add items manually. Pick items for each resume version.'
              : 'All your career content in one place. Pick items for each resume version.'}
          </p>
        </div>

        {SECTION_ORDER.map((sectionType) => {
          const entries = grouped.get(sectionType) || [];

          return (
            <div key={sectionType}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {SECTION_LABELS[sectionType]}
                  {entries.length > 0 && <span className="ml-1 text-gray-400 dark:text-gray-500 normal-case font-normal">({entries.length})</span>}
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
                    <JobGroupCard key={key} group={group} onAdd={handleAdd} onRemove={removePoolEntry} />
                  ))}
                </div>
              )}

              {/* Non-bullet sections — flat list */}
              {sectionType !== 'bullet' && entries.length > 0 && (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-start gap-3">
                        <p className="flex-1 text-sm text-gray-900 dark:text-white min-w-0">{getItemSummary(entry.item)}</p>
                        <button onClick={() => removePoolEntry(entry.id)} className="p-1 text-gray-300 hover:text-rose-500 dark:text-gray-600 dark:hover:text-rose-400 transition-colors" title="Remove">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state for section */}
              {entries.length === 0 && addingSection !== sectionType && (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No items yet</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
