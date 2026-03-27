import type { ResumeSection, SectionContent } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface ModernTemplateProps {
  sections: ResumeSection[];
  onUpdate: (sectionId: string, content: SectionContent) => void;
}

export function ModernTemplate({ sections, onUpdate }: ModernTemplateProps) {
  const contact = sections.find((s) => s.content.type === 'contact');
  const visible = sections.filter((s) => s.visible && s.content.type !== 'contact').sort((a, b) => a.order - b.order);
  const contactData = contact?.content.type === 'contact' ? contact.content.data : null;

  return (
    <div className="font-sans text-stone-800">
      {/* Header — accent bar */}
      {contactData && contact && (
        <div className="bg-primary-600 text-white px-8 py-6 -mx-8 -mt-8 mb-6">
          <InlineEditor
            value={contactData.fullName}
            onChange={(v) => onUpdate(contact.id, { type: 'contact', data: { ...contactData, fullName: v } })}
            placeholder="Your Name"
            tag="h1"
            className="text-3xl font-light tracking-wide text-white"
          />
          <div className="flex gap-3 mt-2 text-sm text-white/80 flex-wrap">
            {contactData.email && <span>{contactData.email}</span>}
            {contactData.phone && <span>{contactData.phone}</span>}
            {contactData.location && <span>{contactData.location}</span>}
          </div>
        </div>
      )}

      {visible.map((section) => (
        <div key={section.id} className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 mb-2">
            {getSectionTitle(section)}
          </h2>
          <div className="border-t border-primary-200 pt-2">
            <RenderSection section={section} onUpdate={onUpdate} />
          </div>
        </div>
      ))}
    </div>
  );
}

function getSectionTitle(section: ResumeSection): string {
  switch (section.content.type) {
    case 'summary': return 'About';
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
        className="text-sm text-stone-600 leading-relaxed"
        multiline
      />
    );
  }

  if (content.type === 'experience') {
    if (content.data.items.length === 0) return <Empty text="No experience added yet." />;
    return (
      <div className="space-y-3">
        {content.data.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-sm">{item.title}</span>
              <span className="text-xs text-stone-400">{item.dateRange.start} - {item.dateRange.end ?? 'Present'}</span>
            </div>
            <div className="text-sm text-primary-600">{item.company}{item.location ? ` — ${item.location}` : ''}</div>
            {item.bullets.length > 0 && (
              <ul className="list-none mt-1 space-y-0.5">
                {item.bullets.map((b, bi) => (
                  <li key={bi} className="text-sm text-stone-600 pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-stone-300">{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'education') {
    if (content.data.items.length === 0) return <Empty text="No education added yet." />;
    return (
      <div className="space-y-2">
        {content.data.items.map((item) => (
          <div key={item.id} className="flex justify-between items-baseline">
            <div>
              <span className="font-medium text-sm">{item.degree} in {item.field}</span>
              <div className="text-sm text-stone-500">{item.institution}</div>
            </div>
            <span className="text-xs text-stone-400">{item.dateRange.start} - {item.dateRange.end ?? 'Present'}</span>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'skills') {
    if (content.data.categories.length === 0) return <Empty text="No skills added yet." />;
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {content.data.categories.map((cat) => (
          <div key={cat.id} className="text-sm">
            <span className="font-medium">{cat.name}: </span>
            <span className="text-stone-600">{cat.skills.join(', ')}</span>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'certifications') {
    if (content.data.items.length === 0) return <Empty text="No certifications yet." />;
    return (
      <div className="space-y-1">
        {content.data.items.map((item) => (
          <div key={item.id} className="text-sm flex justify-between">
            <span>{item.name} — <span className="text-stone-500">{item.issuer}</span></span>
            <span className="text-xs text-stone-400">{item.date}</span>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'projects') {
    if (content.data.items.length === 0) return null;
    return (
      <div className="space-y-2">
        {content.data.items.map((item) => (
          <div key={item.id}>
            <span className="font-medium text-sm">{item.name}</span>
            {item.technologies.length > 0 && <span className="text-xs text-stone-400 ml-1">({item.technologies.join(', ')})</span>}
            <p className="text-sm text-stone-600">{item.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-stone-300 italic">{text}</p>;
}
