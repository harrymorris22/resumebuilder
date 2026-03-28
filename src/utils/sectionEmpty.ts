import type { SectionContent } from '../types/resume';

/** Returns true if a section has no meaningful content and should be hidden from the resume. */
export function isSectionEmpty(content: SectionContent): boolean {
  switch (content.type) {
    case 'contact':
      return false; // contact is always shown if visible
    case 'summary':
      return !content.data.text.trim();
    case 'experience':
    case 'education':
    case 'projects':
    case 'certifications':
      return content.data.items.length === 0;
    case 'skills':
      return content.data.categories.length === 0;
    case 'custom':
      return content.data.items.length === 0;
    default:
      return false;
  }
}
