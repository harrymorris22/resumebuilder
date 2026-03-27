import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../../stores/useAppStore';
import { generateId } from '../../utils/id';
import { ModeToggle } from '../chat/ModeToggle';
import { JobDescriptionInput } from '../chat/JobDescriptionInput';
import type { ContentPoolEntry, ContentPoolItemData, ContentPoolItemType } from '../../types/resume';

const DEFAULT_SECTION_ORDER: ContentPoolItemType[] = [
  'summary', 'bullet', 'education', 'skill_category', 'project', 'certification',
];

/** Map resume section content.type → pool item type */
const RESUME_TO_POOL: Record<string, ContentPoolItemType> = {
  summary: 'summary',
  experience: 'bullet',
  education: 'education',
  skills: 'skill_category',
  projects: 'project',
  certifications: 'certification',
};

/** Map pool item type → resume section content.type */
const POOL_TO_RESUME: Record<ContentPoolItemType, string> = {
  contact: 'contact',
  summary: 'summary',
  bullet: 'experience',
  education: 'education',
  skill_category: 'skills',
  project: 'projects',
  certification: 'certifications',
};

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

  // Sort by start date descending (newest/current job first)
  // Dates can be "Mar 2024", "2020", "Oct 2016", etc. — parse to comparable timestamps
  const parseDate = (d: string): number => {
    if (!d) return 0;
    const t = Date.parse(d);
    if (!isNaN(t)) return t;
    // Try "Mon YYYY" format
    const t2 = Date.parse(`1 ${d}`);
    if (!isNaN(t2)) return t2;
    // Try bare year
    const year = parseInt(d, 10);
    if (!isNaN(year)) return new Date(year, 0).getTime();
    return 0;
  };

  const sorted = new Map(
    [...groups.entries()].sort(([, a], [, b]) => {
      const aIsCurrent = !a.context.endDate || a.context.endDate === 'Present';
      const bIsCurrent = !b.context.endDate || b.context.endDate === 'Present';
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      return parseDate(b.context.startDate) - parseDate(a.context.startDate);
    })
  );

  return sorted;
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

// --- Sortable bullet row ---
function SortableBulletRow({ entry, isChecked, onToggle, onUpdate, onRemove }: {
  entry: ContentPoolEntry;
  isChecked: boolean;
  onToggle: (entry: ContentPoolEntry, isChecked: boolean) => void;
  onUpdate: (entry: ContentPoolEntry) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-start gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700">
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 touch-none mt-0.5 flex-shrink-0"
        title="Drag to reorder"
      >
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.2" /><circle cx="11" cy="3" r="1.2" />
          <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
          <circle cx="5" cy="13" r="1.2" /><circle cx="11" cy="13" r="1.2" />
        </svg>
      </button>
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
}

// --- Job Group Card (with inline add bullet + checkboxes + editable + drag reorder) ---
function JobGroupCard({ group, onAdd, onRemove, onToggle, onUpdate, onReorder, resumeSections }: {
  group: JobGroup;
  onAdd: (entry: ContentPoolEntry) => void;
  onRemove: (id: string) => void;
  onToggle: (entry: ContentPoolEntry, isChecked: boolean) => void;
  onUpdate: (entry: ContentPoolEntry) => void;
  onReorder: (orderedIds: string[]) => void;
  resumeSections: Array<{ content: { type: string; data: unknown } }> | null;
}) {
  const [addingBullet, setAddingBullet] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleBulletDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = group.entries.map((e) => e.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...ids];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  }, [group.entries, onReorder]);

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBulletDragEnd}>
        <SortableContext items={group.entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-stone-100 dark:divide-stone-700">
            {group.entries.map((entry) => {
              const isChecked = resumeSections ? isEntryInResume(entry, resumeSections) : false;
              return (
                <SortableBulletRow
                  key={entry.id}
                  entry={entry}
                  isChecked={isChecked}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      {addingBullet && (
        <AddBulletToJobForm
          context={group.context}
          onAdd={(entry) => { onAdd(entry); }}
        />
      )}
    </div>
  );
}

// --- Sortable non-bullet item row ---
function SortableItemRow({ entry, isChecked, onToggle, onUpdate, onRemove }: {
  entry: ContentPoolEntry;
  isChecked: boolean;
  onToggle: (entry: ContentPoolEntry, isChecked: boolean) => void;
  onUpdate: (entry: ContentPoolEntry) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={`bg-white dark:bg-stone-800 rounded-lg border p-3 transition-colors ${isChecked ? 'border-primary-300 dark:border-primary-600' : 'border-stone-200 dark:border-stone-700'}`}>
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 touch-none mt-0.5 flex-shrink-0"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.2" /><circle cx="11" cy="3" r="1.2" />
            <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="13" r="1.2" /><circle cx="11" cy="13" r="1.2" />
          </svg>
        </button>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggle(entry, isChecked)}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
        />
        {entry.item.type === 'summary' ? (
          <EditableText
            text={entry.item.data.text}
            onSave={(newText) => onUpdate({ ...entry, item: { type: 'summary', data: { text: newText } }, updatedAt: new Date().toISOString() })}
            className="flex-1 text-sm text-stone-900 dark:text-white min-w-0"
          />
        ) : (
          <p className="flex-1 text-sm text-stone-900 dark:text-white min-w-0">{getItemSummary(entry.item)}</p>
        )}
        <button onClick={() => onRemove(entry.id)} className="p-1 text-stone-300 hover:text-rose-500 dark:text-stone-600 dark:hover:text-rose-400 transition-colors" title="Remove from pool">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

// --- Sortable list for non-bullet section items ---
function SortableItemList({ entries, resumeSections, onToggle, onUpdate, onRemove, onReorder }: {
  entries: ContentPoolEntry[];
  resumeSections: Array<{ content: { type: string; data: unknown } }> | null;
  onToggle: (entry: ContentPoolEntry, isChecked: boolean) => void;
  onUpdate: (entry: ContentPoolEntry) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = entries.map((e) => e.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...ids];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  }, [entries, onReorder]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {entries.map((entry) => {
            const isChecked = resumeSections ? isEntryInResume(entry, resumeSections) : false;
            return (
              <SortableItemRow
                key={entry.id}
                entry={entry}
                isChecked={isChecked}
                onToggle={onToggle}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- Sortable section wrapper for drag-and-drop ---
function SortablePoolSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-1 mb-2">
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 touch-none"
          title="Drag to reorder"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

// --- Main Component ---

export function ContentPoolPage() {
  const contentPool = useAppStore((s) => s.contentPool);
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const updateResume = useAppStore((s) => s.updateResume);
  const addPoolEntry = useAppStore((s) => s.addPoolEntry);
  const removePoolEntry = useAppStore((s) => s.removePoolEntry);
  const updatePoolEntry = useAppStore((s) => s.updatePoolEntry);
  const reorderPoolEntries = useAppStore((s) => s.reorderPoolEntries);
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

  // Derive section order from resume sections, with fallback
  const sectionOrder = useMemo<ContentPoolItemType[]>(() => {
    if (!resumeSections || resumeSections.length === 0) return DEFAULT_SECTION_ORDER;

    const ordered: ContentPoolItemType[] = [];
    const resumeOrdered = [...resumeSections]
      .filter((s) => s.content.type !== 'contact')
      .sort((a, b) => a.order - b.order);

    for (const section of resumeOrdered) {
      const poolType = RESUME_TO_POOL[section.content.type];
      if (poolType && !ordered.includes(poolType)) {
        ordered.push(poolType);
      }
    }

    // Append any pool section types not in the resume (orphans)
    for (const t of DEFAULT_SECTION_ORDER) {
      if (!ordered.includes(t)) ordered.push(t);
    }

    return ordered;
  }, [resumeSections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeResume) return;

    const oldIndex = sectionOrder.indexOf(active.id as ContentPoolItemType);
    const newIndex = sectionOrder.indexOf(over.id as ContentPoolItemType);
    if (oldIndex === -1 || newIndex === -1) return;

    // Compute new order — reorder the pool types, then update resume section order values
    const reordered = [...sectionOrder];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Map back to resume sections: assign order = index + 1 (contact is 0)
    const updatedSections = activeResume.sections.map((s) => {
      if (s.content.type === 'contact') return s;
      const poolType = RESUME_TO_POOL[s.content.type];
      const newOrder = reordered.indexOf(poolType);
      return newOrder !== -1 ? { ...s, order: newOrder + 1 } : s;
    });

    updateResume({
      ...activeResume,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    });
  }, [activeResume, sectionOrder, updateResume]);

  const handleToggle = useCallback((entry: ContentPoolEntry, isChecked: boolean) => {
    if (!activeResumeId) return;
    if (isChecked) {
      removePoolItemFromResume(entry.id, activeResumeId);
    } else {
      addPoolItemToResume(entry.id, activeResumeId);
    }
  }, [activeResumeId, addPoolItemToResume, removePoolItemFromResume]);

  const handleItemReorder = useCallback((reorderedSubsetIds: string[]) => {
    // Build new full ordering: keep all IDs in current order, but replace
    // the subset with the reordered version in place
    const currentIds = contentPool.map((e) => e.id);
    const subsetSet = new Set(reorderedSubsetIds);
    const result: string[] = [];
    let subsetIdx = 0;
    for (const id of currentIds) {
      if (subsetSet.has(id)) {
        result.push(reorderedSubsetIds[subsetIdx++]);
      } else {
        result.push(id);
      }
    }
    reorderPoolEntries(result);
  }, [contentPool, reorderPoolEntries]);

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

  // Determine which sections are draggable (have a resume section counterpart)
  const draggableSections = useMemo(() => {
    if (!resumeSections) return new Set<ContentPoolItemType>();
    const types = new Set<string>(resumeSections.map((s) => s.content.type));
    return new Set(
      sectionOrder.filter((poolType) => types.has(POOL_TO_RESUME[poolType]))
    );
  }, [resumeSections, sectionOrder]);

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

        {/* DEV: Seed test data button */}
        {contentPool.length === 0 && (
          <button
            onClick={() => {
              const now = new Date().toISOString();
              const testEntries: ContentPoolEntry[] = [
                { id: generateId(), item: { type: 'summary', data: { text: 'Experienced product manager with 8+ years in healthcare tech, fintech, and consulting. Led cross-functional teams of up to 30 people.' } }, source: 'user', createdAt: now, updatedAt: now },
                // Job 1: Current role (newest)
                { id: generateId(), item: { type: 'bullet', data: { text: 'Grew the Medical Platform from 1 team to 6 teams, managing four other PMs' }, context: { company: 'Numan', title: 'Lead Product Manager', location: 'London', startDate: 'Mar 2024', endDate: null } }, source: 'user', createdAt: now, updatedAt: now },
                { id: generateId(), item: { type: 'bullet', data: { text: 'Led multi-million GBP enquiries from pharma-cos for data access' }, context: { company: 'Numan', title: 'Lead Product Manager', location: 'London', startDate: 'Mar 2024', endDate: null } }, source: 'user', createdAt: now, updatedAt: now },
                { id: generateId(), item: { type: 'bullet', data: { text: 'Built Electronic Patient Record — migrated data into interoperable database' }, context: { company: 'Numan', title: 'Lead Product Manager', location: 'London', startDate: 'Mar 2024', endDate: null } }, source: 'user', createdAt: now, updatedAt: now },
                // Job 2: Previous role
                { id: generateId(), item: { type: 'bullet', data: { text: 'Led the Medical Platform Team dedicated to improving clinical outcomes' }, context: { company: 'Numan', title: 'Senior Product Manager', location: 'London', startDate: 'Jan 2022', endDate: 'Mar 2024' } }, source: 'user', createdAt: now, updatedAt: now },
                { id: generateId(), item: { type: 'bullet', data: { text: 'Launched prescription management system serving 50k+ patients monthly' }, context: { company: 'Numan', title: 'Senior Product Manager', location: 'London', startDate: 'Jan 2022', endDate: 'Mar 2024' } }, source: 'user', createdAt: now, updatedAt: now },
                // Job 3: Older role
                { id: generateId(), item: { type: 'bullet', data: { text: 'Consistently ranked top 5 analyst in Canada — 1 of 3 promoted to Accenture Digital' }, context: { company: 'Accenture', title: 'Management Consulting Analyst', location: 'Toronto', startDate: 'Oct 2016', endDate: 'Oct 2018' } }, source: 'user', createdAt: now, updatedAt: now },
                { id: generateId(), item: { type: 'bullet', data: { text: 'Developed the business case for a suite of digital mortgage products' }, context: { company: 'Accenture', title: 'Management Consulting Analyst', location: 'Toronto', startDate: 'Oct 2016', endDate: 'Oct 2018' } }, source: 'user', createdAt: now, updatedAt: now },
                // Education
                { id: generateId(), item: { type: 'education', data: { id: generateId(), institution: 'University of Toronto', degree: 'BComm', field: 'Finance & Economics', dateRange: { start: '2012', end: '2016' } } }, source: 'user', createdAt: now, updatedAt: now },
                // Skills
                { id: generateId(), item: { type: 'skill_category', data: { id: generateId(), name: 'Product', skills: ['Roadmapping', 'User Research', 'A/B Testing', 'Agile/Scrum'] } }, source: 'user', createdAt: now, updatedAt: now },
                { id: generateId(), item: { type: 'skill_category', data: { id: generateId(), name: 'Technical', skills: ['SQL', 'Python', 'Figma', 'Amplitude'] } }, source: 'user', createdAt: now, updatedAt: now },
              ];
              for (const entry of testEntries) addPoolEntry(entry);
            }}
            className="text-xs px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-md transition-colors"
          >
            Seed Test Data
          </button>
        )}

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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            {sectionOrder.map((sectionType) => {
              const entries = grouped.get(sectionType) || [];
              const isDraggable = draggableSections.has(sectionType);

              const sectionHeader = (
                <>
                  <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex-1">
                    {SECTION_LABELS[sectionType]}
                    {entries.length > 0 && <span className="ml-1 text-stone-400 dark:text-stone-500 normal-case font-normal">({entries.length})</span>}
                  </h3>
                  <button
                    onClick={() => setAddingSection(addingSection === sectionType ? null : sectionType)}
                    className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-0.5"
                  >
                    {addingSection === sectionType ? 'Cancel' : sectionType === 'bullet' ? '+ New Job' : '+ Add'}
                  </button>
                </>
              );

              return (
                <div key={sectionType}>
                  {isDraggable ? (
                    <SortablePoolSection id={sectionType}>
                      {sectionHeader}
                    </SortablePoolSection>
                  ) : (
                    <div className="flex items-center justify-between mb-2">
                      {sectionHeader}
                    </div>
                  )}

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
                        <JobGroupCard key={key} group={group} onAdd={handleAdd} onRemove={removePoolEntry} onToggle={handleToggle} onUpdate={updatePoolEntry} onReorder={handleItemReorder} resumeSections={resumeSections} />
                      ))}
                    </div>
                  )}

                  {/* Non-bullet sections — flat list with checkboxes + drag reorder */}
                  {sectionType !== 'bullet' && entries.length > 0 && (
                    <SortableItemList
                      entries={entries}
                      resumeSections={resumeSections}
                      onToggle={handleToggle}
                      onUpdate={updatePoolEntry}
                      onRemove={removePoolEntry}
                      onReorder={handleItemReorder}
                    />
                  )}

                  {/* Empty state for section */}
                  {entries.length === 0 && addingSection !== sectionType && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 italic">No items yet</p>
                  )}
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
