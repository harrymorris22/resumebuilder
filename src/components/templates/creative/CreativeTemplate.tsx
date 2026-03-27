import type { ResumeSection, SectionContent } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface CreativeTemplateProps {
  sections: ResumeSection[];
  onUpdate: (sectionId: string, content: SectionContent) => void;
}

export function CreativeTemplate({ sections, onUpdate }: CreativeTemplateProps) {
  const contact = sections.find((s) => s.content.type === 'contact');
  const visible = sections.filter((s) => s.visible && s.content.type !== 'contact').sort((a, b) => a.order - b.order);
  const contactData = contact?.content.type === 'contact' ? contact.content.data : null;

  // Split into sidebar sections (contact, skills) and main sections
  const sidebarTypes = new Set(['skills']);
  const sidebarSections = visible.filter((s) => sidebarTypes.has(s.content.type));
  const mainSections = visible.filter((s) => !sidebarTypes.has(s.content.type));

  return (
    <div className="font-sans text-stone-800">
      {/* Creative header */}
      {contactData && contact && (
        <div className="mb-6 pb-4 border-b-2 border-stone-800">
          <InlineEditor
            value={contactData.fullName}
            onChange={(v) => onUpdate(contact.id, { type: 'contact', data: { ...contactData, fullName: v } })}
            placeholder="Your Name"
            tag="h1"
            className="text-3xl font-bold text-stone-900 tracking-tight"
            // Playfair Display would be loaded via Google Fonts in production
          />
          <div className="flex gap-3 mt-1 text-sm text-stone-500 flex-wrap">
            {contactData.email && <span>{contactData.email}</span>}
            {contactData.phone && <span>&#183; {contactData.phone}</span>}
            {contactData.location && <span>&#183; {contactData.location}</span>}
            {contactData.linkedin && <span>&#183; {contactData.linkedin}</span>}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          {mainSections.map((section) => (
            <div key={section.id} className="mb-5">
              <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-600 rounded-full" />
                {getSectionTitle(section)}
              </h2>
              <RenderSection section={section} onUpdate={onUpdate} />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        {sidebarSections.length > 0 && (
          <div className="w-44 flex-shrink-0">
            {sidebarSections.map((section) => (
              <div key={section.id} className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  {getSectionTitle(section)}
                </h2>
                <RenderSection section={section} onUpdate={onUpdate} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getSectionTitle(section: ResumeSection): string {
  switch (section.content.type) {
    case 'summary': return 'Profile';
    case 'experience': return 'Experience';
    case 'education': return 'Education';
    case 'skills': return 'Skills';
    case 'certifications': return 'Certifications';
    case 'projects': return 'Projects';
    case 'custom': return section.content.data.heading || 'Other';
    default: return '';
  }
}

function RenderSection({ section, onUpdate }: { section: ResumeSection; onUpdate: (id: string, content: SectionContent) => void }) {
  const { content } = section;

  if (content.type === 'summary') {
    return (
      <InlineEditor
        value={content.data.text}
        onChange={(text) => onUpdate(section.id, { type: 'summary', data: { text } })}
        placeholder="Professional summary..."
        tag="p"
        className="text-sm text-stone-600 leading-relaxed border-l-2 border-primary-200 pl-3"
        multiline
      />
    );
  }

  if (content.type === 'experience') {
    if (content.data.items.length === 0) return <p className="text-sm text-stone-300 italic">No experience yet.</p>;
    return (
      <div className="space-y-4">
        {content.data.items.map((item) => (
          <div key={item.id} className="relative pl-4 border-l-2 border-stone-200">
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-primary-600 rounded-full" />
            <div className="font-medium text-sm">{item.title}</div>
            <div className="text-sm text-primary-600">{item.company}</div>
            <div className="text-xs text-stone-400">{item.dateRange.start} - {item.dateRange.end ?? 'Present'}</div>
            {item.bullets.length > 0 && (
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                {item.bullets.map((b, bi) => (
                  <li key={bi} className="text-sm text-stone-600">{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'education') {
    if (content.data.items.length === 0) return <p className="text-sm text-stone-300 italic">No education yet.</p>;
    return (
      <div className="space-y-2">
        {content.data.items.map((item) => (
          <div key={item.id}>
            <div className="font-medium text-sm">{item.degree} in {item.field}</div>
            <div className="text-sm text-stone-500">{item.institution}</div>
            <div className="text-xs text-stone-400">{item.dateRange.start} - {item.dateRange.end ?? 'Present'}</div>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'skills') {
    if (content.data.categories.length === 0) return <p className="text-xs text-stone-300 italic">No skills yet.</p>;
    return (
      <div className="space-y-2">
        {content.data.categories.map((cat) => (
          <div key={cat.id}>
            <div className="text-xs font-medium text-stone-700 mb-0.5">{cat.name}</div>
            <div className="flex flex-wrap gap-1">
              {cat.skills.map((s) => (
                <span key={s} className="px-1.5 py-0.5 text-xs bg-stone-100 rounded text-stone-600">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'certifications') {
    if (content.data.items.length === 0) return null;
    return (
      <div className="space-y-1">
        {content.data.items.map((item) => (
          <div key={item.id} className="text-sm">
            <span className="font-medium">{item.name}</span>
            <div className="text-xs text-stone-400">{item.issuer} — {item.date}</div>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'projects') {
    if (content.data.items.length === 0) return null;
    return (
      <div className="space-y-3">
        {content.data.items.map((item) => (
          <div key={item.id}>
            <div className="font-medium text-sm">{item.name}</div>
            {item.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {item.technologies.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 text-xs bg-primary-50 text-primary-700 rounded">{t}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-stone-600 mt-0.5">{item.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
