import type { ResumeSection, ExperienceItem, EducationItem, ProjectItem, SkillCategory } from '../../types/resume';
import { useAppStore } from '../../stores/useAppStore';
import { DiffText } from './DiffText';

interface DiffResumePreviewProps {
  snapshot: ResumeSection[];
}

function findSection(sections: ResumeSection[], id: string) {
  return sections.find((s) => s.id === id);
}

function DiffSummary({ oldText, newText }: { oldText: string; newText: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Summary
      </h2>
      <p className="text-sm leading-relaxed">
        <DiffText oldText={oldText} newText={newText} />
      </p>
    </div>
  );
}

function DiffExperienceItem({ oldItem, newItem }: { oldItem?: ExperienceItem; newItem?: ExperienceItem }) {
  const title = newItem?.title ?? oldItem?.title ?? '';
  const company = newItem?.company ?? oldItem?.company ?? '';
  const location = newItem?.location ?? oldItem?.location ?? '';
  const oldBullets = oldItem?.bullets ?? [];
  const newBullets = newItem?.bullets ?? [];
  const maxLen = Math.max(oldBullets.length, newBullets.length);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline">
        <div>
          <span className="text-sm font-semibold">{title}</span>
          {company && <span className="text-sm text-stone-600"> — {company}</span>}
        </div>
        {location && <span className="text-xs text-stone-500">{location}</span>}
      </div>
      <ul className="list-disc ml-5 mt-1 space-y-0.5">
        {Array.from({ length: maxLen }, (_, i) => (
          <li key={i} className="text-sm leading-relaxed">
            <DiffText oldText={oldBullets[i] ?? ''} newText={newBullets[i] ?? ''} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiffExperience({ oldItems, newItems }: { oldItems: ExperienceItem[]; newItems: ExperienceItem[] }) {
  // Match by id, then show unmatched
  const seen = new Set<string>();
  const pairs: { old?: ExperienceItem; new?: ExperienceItem }[] = [];

  for (const newItem of newItems) {
    const oldItem = oldItems.find((o) => o.id === newItem.id);
    if (oldItem) seen.add(oldItem.id);
    pairs.push({ old: oldItem, new: newItem });
  }
  for (const oldItem of oldItems) {
    if (!seen.has(oldItem.id)) {
      pairs.push({ old: oldItem });
    }
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Experience
      </h2>
      {pairs.map((pair, i) => (
        <DiffExperienceItem key={pair.new?.id ?? pair.old?.id ?? i} oldItem={pair.old} newItem={pair.new} />
      ))}
    </div>
  );
}

function DiffSkills({ oldCategories, newCategories }: { oldCategories: SkillCategory[]; newCategories: SkillCategory[] }) {
  const seen = new Set<string>();
  const pairs: { old?: SkillCategory; new?: SkillCategory }[] = [];

  for (const newCat of newCategories) {
    const oldCat = oldCategories.find((o) => o.id === newCat.id);
    if (oldCat) seen.add(oldCat.id);
    pairs.push({ old: oldCat, new: newCat });
  }
  for (const oldCat of oldCategories) {
    if (!seen.has(oldCat.id)) {
      pairs.push({ old: oldCat });
    }
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Skills
      </h2>
      {pairs.map((pair, i) => {
        const name = pair.new?.name ?? pair.old?.name ?? '';
        const oldSkills = pair.old?.skills.join(', ') ?? '';
        const newSkills = pair.new?.skills.join(', ') ?? '';
        return (
          <div key={pair.new?.id ?? pair.old?.id ?? i} className="mb-1">
            <span className="text-sm font-semibold">{name}: </span>
            <span className="text-sm">
              <DiffText oldText={oldSkills} newText={newSkills} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DiffEducation({ oldItems, newItems }: { oldItems: EducationItem[]; newItems: EducationItem[] }) {
  const seen = new Set<string>();
  const pairs: { old?: EducationItem; new?: EducationItem }[] = [];

  for (const newItem of newItems) {
    const oldItem = oldItems.find((o) => o.id === newItem.id);
    if (oldItem) seen.add(oldItem.id);
    pairs.push({ old: oldItem, new: newItem });
  }
  for (const oldItem of oldItems) {
    if (!seen.has(oldItem.id)) {
      pairs.push({ old: oldItem });
    }
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Education
      </h2>
      {pairs.map((pair, i) => {
        const newIt = pair.new;
        const oldIt = pair.old;
        return (
          <div key={newIt?.id ?? oldIt?.id ?? i} className="mb-2">
            <div className="text-sm font-semibold">
              <DiffText oldText={oldIt?.degree ?? ''} newText={newIt?.degree ?? ''} />
              {' — '}
              <DiffText oldText={oldIt?.field ?? ''} newText={newIt?.field ?? ''} />
            </div>
            <div className="text-sm text-stone-600">
              {newIt?.institution ?? oldIt?.institution}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiffProjects({ oldItems, newItems }: { oldItems: ProjectItem[]; newItems: ProjectItem[] }) {
  const seen = new Set<string>();
  const pairs: { old?: ProjectItem; new?: ProjectItem }[] = [];

  for (const newItem of newItems) {
    const oldItem = oldItems.find((o) => o.id === newItem.id);
    if (oldItem) seen.add(oldItem.id);
    pairs.push({ old: oldItem, new: newItem });
  }
  for (const oldItem of oldItems) {
    if (!seen.has(oldItem.id)) {
      pairs.push({ old: oldItem });
    }
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Projects
      </h2>
      {pairs.map((pair, i) => {
        const name = pair.new?.name ?? pair.old?.name ?? '';
        const oldBullets = pair.old?.bullets ?? [];
        const newBullets = pair.new?.bullets ?? [];
        const maxLen = Math.max(oldBullets.length, newBullets.length);
        return (
          <div key={pair.new?.id ?? pair.old?.id ?? i} className="mb-3">
            <span className="text-sm font-semibold">{name}</span>
            <p className="text-sm text-stone-600">
              <DiffText oldText={pair.old?.description ?? ''} newText={pair.new?.description ?? ''} />
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              {Array.from({ length: maxLen }, (_, j) => (
                <li key={j} className="text-sm leading-relaxed">
                  <DiffText oldText={oldBullets[j] ?? ''} newText={newBullets[j] ?? ''} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function DiffResumePreview({ snapshot }: DiffResumePreviewProps) {
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const activeResume = resumes.find((r) => r.id === activeResumeId);

  if (!activeResume) return null;

  const currentSections = activeResume.sections;

  return (
    <div className="flex flex-col h-full bg-stone-100">
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="relative bg-white shadow-lg w-full max-w-[8.5in] min-h-[11in] text-stone-900" style={{ padding: '0.5in' }}>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 pb-3 border-b border-stone-200">
            <span className="text-xs font-medium text-stone-500">Changes:</span>
            <span className="text-xs">
              <span className="bg-red-100 text-red-700 line-through px-1">removed</span>
            </span>
            <span className="text-xs">
              <span className="bg-green-100 text-green-700 px-1">added</span>
            </span>
          </div>

          {currentSections
            .filter((s) => s.visible)
            .sort((a, b) => a.order - b.order)
            .map((section) => {
              const oldSection = findSection(snapshot, section.id);
              const { content } = section;
              const oldContent = oldSection?.content;

              if (content.type === 'contact') {
                // Skip contact diffs — rarely changed by AI
                const d = content.data;
                return (
                  <div key={section.id} className="text-center mb-4">
                    <h1 className="text-xl font-bold">{d.fullName}</h1>
                    <p className="text-xs text-stone-500">
                      {[d.email, d.phone, d.location].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                );
              }

              if (content.type === 'summary') {
                const oldText = oldContent?.type === 'summary' ? oldContent.data.text : '';
                return <DiffSummary key={section.id} oldText={oldText} newText={content.data.text} />;
              }

              if (content.type === 'experience') {
                const oldItems = oldContent?.type === 'experience' ? oldContent.data.items : [];
                return <DiffExperience key={section.id} oldItems={oldItems} newItems={content.data.items} />;
              }

              if (content.type === 'skills') {
                const oldCats = oldContent?.type === 'skills' ? oldContent.data.categories : [];
                return <DiffSkills key={section.id} oldCategories={oldCats} newCategories={content.data.categories} />;
              }

              if (content.type === 'education') {
                const oldItems = oldContent?.type === 'education' ? oldContent.data.items : [];
                return <DiffEducation key={section.id} oldItems={oldItems} newItems={content.data.items} />;
              }

              if (content.type === 'projects') {
                const oldItems = oldContent?.type === 'projects' ? oldContent.data.items : [];
                return <DiffProjects key={section.id} oldItems={oldItems} newItems={content.data.items} />;
              }

              // Certifications + custom: just render as-is (rarely changed by AI)
              return null;
            })}
        </div>
      </div>
    </div>
  );
}
