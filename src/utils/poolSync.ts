import type { ContentPoolEntry, ContentPoolItemData, Resume } from '../types/resume';
import { generateId } from './id';

type ToolInput = Record<string, unknown>;

/**
 * Creates content pool entries from a generation tool call's input.
 * Returns an empty array for unknown tool names.
 */
export function createPoolEntriesFromTool(
  toolName: string,
  input: ToolInput,
  resume?: Resume,
): ContentPoolEntry[] {
  const now = new Date().toISOString();

  function makeEntry(item: ContentPoolItemData): ContentPoolEntry {
    return { id: generateId(), item, source: 'ai', createdAt: now, updatedAt: now };
  }

  switch (toolName) {
    case 'add_skills':
      return [
        makeEntry({
          type: 'skill_category',
          data: { id: generateId(), name: input.categoryName as string, skills: input.skills as string[] },
        }),
      ];

    case 'add_experience':
      return ((input.bullets as string[]) || []).map((text) =>
        makeEntry({
          type: 'bullet',
          data: { text },
          context: {
            company: (input.company as string) || '',
            title: (input.title as string) || '',
            startDate: (input.startDate as string) || '',
            endDate: input.endDate === null || input.endDate === undefined ? null : (input.endDate as string),
          },
        }),
      );

    case 'update_experience_bullets': {
      // Look up the experience item from the resume to get company/title context
      let company = '';
      let title = '';
      let startDate = '';
      let endDate: string | null = null;
      if (resume) {
        const expSection = resume.sections.find((s) => s.content.type === 'experience');
        if (expSection && expSection.content.type === 'experience') {
          const item = expSection.content.data.items.find((i) => i.id === input.experienceId);
          if (item) {
            company = item.company;
            title = item.title;
            startDate = item.dateRange.start;
            endDate = item.dateRange.end;
          }
        }
      }
      return ((input.bullets as string[]) || []).map((text) =>
        makeEntry({
          type: 'bullet',
          data: { text },
          context: { company, title, startDate, endDate },
        }),
      );
    }

    case 'add_education':
      return [
        makeEntry({
          type: 'education',
          data: {
            id: generateId(),
            institution: (input.institution as string) || '',
            degree: (input.degree as string) || '',
            field: (input.field as string) || '',
            dateRange: {
              start: (input.startDate as string) || '',
              end: input.endDate === null || input.endDate === undefined ? null : (input.endDate as string),
            },
            gpa: input.gpa as string | undefined,
          },
        }),
      ];

    case 'add_certification':
      return [
        makeEntry({
          type: 'certification',
          data: {
            id: generateId(),
            name: (input.name as string) || '',
            issuer: (input.issuer as string) || '',
            date: (input.date as string) || '',
            url: input.url as string | undefined,
          },
        }),
      ];

    case 'add_project':
      return [
        makeEntry({
          type: 'project',
          data: {
            id: generateId(),
            name: (input.name as string) || '',
            description: (input.description as string) || '',
            technologies: (input.technologies as string[]) || [],
            url: input.url as string | undefined,
            bullets: (input.bullets as string[]) || [],
          },
        }),
      ];

    case 'set_summary':
      return [
        makeEntry({ type: 'summary', data: { text: (input.text as string) || '' } }),
      ];

    case 'update_contact':
      return [
        makeEntry({
          type: 'contact',
          data: {
            fullName: (input.fullName as string) || '',
            email: (input.email as string) || '',
            phone: (input.phone as string) || '',
            location: (input.location as string) || '',
            linkedin: input.linkedin as string | undefined,
            github: input.github as string | undefined,
            website: input.website as string | undefined,
          },
        }),
      ];

    default:
      return [];
  }
}

/**
 * Checks whether an equivalent entry already exists in the pool.
 * Uses content-based matching per item type.
 */
export function isDuplicatePoolEntry(
  entry: ContentPoolEntry,
  pool: ContentPoolEntry[],
): boolean {
  const item = entry.item;

  switch (item.type) {
    case 'bullet':
      return pool.some(
        (e) =>
          e.item.type === 'bullet' &&
          e.item.data.text === item.data.text &&
          e.item.context.company === item.context.company &&
          e.item.context.title === item.context.title,
      );

    case 'skill_category':
      return pool.some(
        (e) =>
          e.item.type === 'skill_category' &&
          e.item.data.name.toLowerCase() === item.data.name.toLowerCase(),
      );

    case 'education':
      return pool.some(
        (e) =>
          e.item.type === 'education' &&
          e.item.data.institution === item.data.institution &&
          e.item.data.degree === item.data.degree,
      );

    case 'summary':
      return pool.some((e) => e.item.type === 'summary');

    case 'contact':
      return pool.some((e) => e.item.type === 'contact');

    case 'project':
      return pool.some(
        (e) => e.item.type === 'project' && e.item.data.name === item.data.name,
      );

    case 'certification':
      return pool.some(
        (e) => e.item.type === 'certification' && e.item.data.name === item.data.name,
      );

    default:
      return false;
  }
}
