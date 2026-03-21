import type { ResumeSection, SectionContent } from '../../types/resume';
import { ContactSection } from '../templates/classic/ContactSection';
import { SummarySection } from '../templates/classic/SummarySection';
import { ExperienceSection } from '../templates/classic/ExperienceSection';
import { EducationSection } from '../templates/classic/EducationSection';
import { SkillsSection } from '../templates/classic/SkillsSection';
import { CertificationsSection } from '../templates/classic/CertificationsSection';
import { ProjectsSection } from '../templates/classic/ProjectsSection';

interface SectionRendererProps {
  section: ResumeSection;
  onUpdate: (content: SectionContent) => void;
}

export function SectionRenderer({ section, onUpdate }: SectionRendererProps) {
  const { content } = section;

  switch (content.type) {
    case 'contact':
      return (
        <ContactSection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'contact', data })}
        />
      );
    case 'summary':
      return (
        <SummarySection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'summary', data })}
        />
      );
    case 'experience':
      return (
        <ExperienceSection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'experience', data })}
        />
      );
    case 'education':
      return (
        <EducationSection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'education', data })}
        />
      );
    case 'skills':
      return (
        <SkillsSection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'skills', data })}
        />
      );
    case 'certifications':
      return (
        <CertificationsSection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'certifications', data })}
        />
      );
    case 'projects':
      return (
        <ProjectsSection
          data={content.data}
          onUpdate={(data) => onUpdate({ type: 'projects', data })}
        />
      );
    case 'custom':
      return (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            {content.data.heading || 'Custom Section'}
          </h2>
          {content.data.items.length === 0 && (
            <p className="text-sm text-gray-300 italic">Empty section</p>
          )}
        </div>
      );
    default:
      return null;
  }
}
