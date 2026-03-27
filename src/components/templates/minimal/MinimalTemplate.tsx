import type { ResumeSection, SectionContent } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface MinimalTemplateProps {
  sections: ResumeSection[];
  onUpdate: (sectionId: string, content: SectionContent) => void;
}

export function MinimalTemplate({ sections, onUpdate }: MinimalTemplateProps) {
  const contact = sections.find((s) => s.content.type === 'contact');
  const visible = sections.filter((s) => s.visible && s.content.type !== 'contact').sort((a, b) => a.order - b.order);
  const contactData = contact?.content.type === 'contact' ? contact.content.data : null;

  return (
    <div className="font-sans text-stone-900 max-w-2xl mx-auto">
      {/* Minimal header — just name and details */}
      {contactData && contact && (
        <div className="mb-8">
          <InlineEditor
            value={contactData.fullName}
            onChange={(v) => onUpdate(contact.id, { type: 'contact', data: { ...contactData, fullName: v } })}
            placeholder="Your Name"
            tag="h1"
            className="text-2xl font-normal text-stone-900"
          />
          <div className="text-sm text-stone-400 mt-1">
            {[contactData.email, contactData.phone, contactData.location].filter(Boolean).join(' / ')}
          </div>
        </div>
      )}

      {visible.map((section) => (
        <div key={section.id} className="mb-6">
          <h2 className="text-sm text-stone-400 mb-2 uppercase tracking-wide">
            {getSectionTitle(section)}
          </h2>
          <RenderSection section={section} onUpdate={onUpdate} />
        </div>
      ))}
    </div>
  );
}

function getSectionTitle(section: ResumeSection): string {
  switch (section.content.type) {
    case 'summary': return 'Summary';
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
    if (content.data.items.length === 0) return <p className="text-sm text-stone-300 italic">No experience yet.</p>;
    return (
      <div className="space-y-4">
        {content.data.items.map((item) => (
          <div key={item.id}>
            <div className="text-sm">
              <span className="font-medium">{item.title}</span>
              <span className="text-stone-400"> — {item.company}</span>
            </div>
            <div className="text-xs text-stone-400">{item.dateRange.start} - {item.dateRange.end ?? 'Present'}</div>
            {item.bullets.length > 0 && (
              <ul className="mt-1 space-y-0.5">
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
          <div key={item.id} className="text-sm">
            <span className="font-medium">{item.degree}</span> in {item.field}
            <span className="text-stone-400"> — {item.institution}</span>
          </div>
        ))}
      </div>
    );
  }

  if (content.type === 'skills') {
    if (content.data.categories.length === 0) return <p className="text-sm text-stone-300 italic">No skills yet.</p>;
    return (
      <div className="text-sm text-stone-600">
        {content.data.categories.map((cat) => cat.skills.join(', ')).join(' · ')}
      </div>
    );
  }

  if (content.type === 'certifications') {
    if (content.data.items.length === 0) return null;
    return (
      <div className="text-sm text-stone-600 space-y-0.5">
        {content.data.items.map((item) => (
          <div key={item.id}>{item.name} ({item.issuer})</div>
        ))}
      </div>
    );
  }

  if (content.type === 'projects') {
    if (content.data.items.length === 0) return null;
    return (
      <div className="space-y-2">
        {content.data.items.map((item) => (
          <div key={item.id} className="text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-stone-400"> — {item.description}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
