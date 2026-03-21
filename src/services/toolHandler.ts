import type { Resume, ResumeSection, ExperienceItem, EducationItem, CertificationItem, ProjectItem, SkillCategory, ContentBankItem, CoverLetter, JobDescription } from '../types/resume';
import type { StarSuggestion, BankItemSuggestion } from '../types/chat';
import { generateId } from '../utils/id';

type ToolInput = Record<string, unknown>;

interface ToolHandlerContext {
  resume: Resume;
  updateResume: (resume: Resume) => void;
  addContentBankItem: (item: ContentBankItem) => void;
  onStarSuggestion?: (suggestion: StarSuggestion) => void;
  onBankItemSuggestion?: (suggestion: BankItemSuggestion) => void;
  onJobAnalyzed?: (job: JobDescription) => void;
  onCoverLetterGenerated?: (letter: CoverLetter) => void;
}

function findSection(resume: Resume, type: string): ResumeSection | undefined {
  return resume.sections.find((s) => s.content.type === type);
}

function updateSection(resume: Resume, sectionId: string, content: ResumeSection['content']): Resume {
  return {
    ...resume,
    sections: resume.sections.map((s) =>
      s.id === sectionId ? { ...s, content } : s
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function handleToolCall(
  toolName: string,
  input: ToolInput,
  ctx: ToolHandlerContext
): string {
  const { resume, updateResume, addContentBankItem, onStarSuggestion, onBankItemSuggestion, onJobAnalyzed, onCoverLetterGenerated } = ctx;

  switch (toolName) {
    case 'update_contact': {
      const section = findSection(resume, 'contact');
      if (!section || section.content.type !== 'contact') return 'Error: contact section not found';
      const data = { ...section.content.data };
      if (input.fullName) data.fullName = input.fullName as string;
      if (input.email) data.email = input.email as string;
      if (input.phone) data.phone = input.phone as string;
      if (input.location) data.location = input.location as string;
      if (input.linkedin !== undefined) data.linkedin = input.linkedin as string;
      if (input.github !== undefined) data.github = input.github as string;
      if (input.website !== undefined) data.website = input.website as string;
      updateResume(updateSection(resume, section.id, { type: 'contact', data }));
      return 'Contact information updated.';
    }

    case 'set_summary': {
      const section = findSection(resume, 'summary');
      if (!section) return 'Error: summary section not found';
      updateResume(updateSection(resume, section.id, { type: 'summary', data: { text: input.text as string } }));
      return 'Professional summary updated.';
    }

    case 'add_experience': {
      const section = findSection(resume, 'experience');
      if (!section || section.content.type !== 'experience') return 'Error: experience section not found';
      const newItem: ExperienceItem = {
        id: generateId(),
        company: (input.company as string) || '',
        title: (input.title as string) || '',
        location: (input.location as string) || '',
        dateRange: {
          start: (input.startDate as string) || '',
          end: input.endDate === null || input.endDate === undefined ? null : (input.endDate as string),
        },
        bullets: (input.bullets as string[]) || [],
      };
      const items = [...section.content.data.items, newItem];
      updateResume(updateSection(resume, section.id, { type: 'experience', data: { items } }));
      return `Added experience: ${newItem.title} at ${newItem.company}. Item ID: ${newItem.id}`;
    }

    case 'update_experience_bullets': {
      const section = findSection(resume, 'experience');
      if (!section || section.content.type !== 'experience') return 'Error: experience section not found';
      const items = section.content.data.items.map((item) =>
        item.id === input.experienceId
          ? { ...item, bullets: input.bullets as string[] }
          : item
      );
      updateResume(updateSection(resume, section.id, { type: 'experience', data: { items } }));
      return 'Experience bullets updated.';
    }

    case 'add_education': {
      const section = findSection(resume, 'education');
      if (!section || section.content.type !== 'education') return 'Error: education section not found';
      const newItem: EducationItem = {
        id: generateId(),
        institution: (input.institution as string) || '',
        degree: (input.degree as string) || '',
        field: (input.field as string) || '',
        dateRange: {
          start: (input.startDate as string) || '',
          end: input.endDate === null || input.endDate === undefined ? null : (input.endDate as string),
        },
        gpa: input.gpa as string | undefined,
      };
      const items = [...section.content.data.items, newItem];
      updateResume(updateSection(resume, section.id, { type: 'education', data: { items } }));
      return `Added education: ${newItem.degree} at ${newItem.institution}`;
    }

    case 'add_skills': {
      const section = findSection(resume, 'skills');
      if (!section || section.content.type !== 'skills') return 'Error: skills section not found';
      const categories = [...section.content.data.categories];
      const existingIdx = categories.findIndex(
        (c) => c.name.toLowerCase() === (input.categoryName as string).toLowerCase()
      );
      if (existingIdx !== -1) {
        const existing = categories[existingIdx];
        const newSkills = (input.skills as string[]).filter(
          (s) => !existing.skills.includes(s)
        );
        categories[existingIdx] = { ...existing, skills: [...existing.skills, ...newSkills] };
      } else {
        const newCat: SkillCategory = {
          id: generateId(),
          name: input.categoryName as string,
          skills: input.skills as string[],
        };
        categories.push(newCat);
      }
      updateResume(updateSection(resume, section.id, { type: 'skills', data: { categories } }));
      return `Skills updated: ${input.categoryName}`;
    }

    case 'add_certification': {
      const section = findSection(resume, 'certifications');
      if (!section || section.content.type !== 'certifications') return 'Error: certifications section not found';
      const newItem: CertificationItem = {
        id: generateId(),
        name: (input.name as string) || '',
        issuer: (input.issuer as string) || '',
        date: (input.date as string) || '',
        url: input.url as string | undefined,
      };
      const items = [...section.content.data.items, newItem];
      updateResume(updateSection(resume, section.id, { type: 'certifications', data: { items } }));
      return `Added certification: ${newItem.name}`;
    }

    case 'add_project': {
      let section = findSection(resume, 'projects');
      if (!section) {
        // Add projects section if it doesn't exist
        const newSection: ResumeSection = {
          id: generateId(),
          order: resume.sections.length,
          visible: true,
          content: { type: 'projects', data: { items: [] } },
        };
        const updated = {
          ...resume,
          sections: [...resume.sections, newSection],
          updatedAt: new Date().toISOString(),
        };
        updateResume(updated);
        section = newSection;
      }
      if (section.content.type !== 'projects') return 'Error: projects section type mismatch';
      const newItem: ProjectItem = {
        id: generateId(),
        name: (input.name as string) || '',
        description: (input.description as string) || '',
        technologies: (input.technologies as string[]) || [],
        url: input.url as string | undefined,
        bullets: (input.bullets as string[]) || [],
      };
      const items = [...section.content.data.items, newItem];
      // Need to re-read resume since we might have just added the section
      const currentResume = { ...resume, sections: resume.sections.map(s => s.id === section!.id ? section! : s) };
      updateResume(updateSection(currentResume, section.id, { type: 'projects', data: { items } }));
      return `Added project: ${newItem.name}`;
    }

    case 'add_to_content_bank': {
      const item: ContentBankItem = {
        id: generateId(),
        type: input.type as ContentBankItem['type'],
        text: input.text as string,
        tags: (input.tags as string[]) || [],
        source: 'ai',
        createdAt: new Date().toISOString(),
        metadata: input.metadata as ContentBankItem['metadata'],
      };
      addContentBankItem(item);
      return `Saved to content bank: "${(input.text as string).slice(0, 50)}..."`;
    }

    case 'suggest_star_rewrite': {
      if (onStarSuggestion) {
        onStarSuggestion({
          originalText: input.originalText as string,
          starText: input.starText as string,
          sectionId: input.sectionId as string | undefined,
          itemId: input.itemId as string | undefined,
          bulletIndex: input.bulletIndex as number | undefined,
          status: 'pending',
        });
      }
      return 'STAR rewrite suggestion presented to user.';
    }

    case 'analyze_job_description': {
      const job: JobDescription = {
        id: generateId(),
        title: input.title as string,
        company: input.company as string,
        rawText: '',
        keywords: (input.keywords as string[]) || [],
        createdAt: new Date().toISOString(),
      };
      if (onJobAnalyzed) onJobAnalyzed(job);
      return `Job analyzed: ${job.title} at ${job.company}. Keywords: ${job.keywords.join(', ')}`;
    }

    case 'suggest_bank_item': {
      if (onBankItemSuggestion) {
        onBankItemSuggestion({
          bankItemId: input.bankItemId as string,
          reason: input.reason as string,
          targetSection: input.targetSection as string | undefined,
          status: 'pending',
        });
      }
      return 'Bank item suggestion presented to user.';
    }

    case 'generate_cover_letter': {
      const letter: CoverLetter = {
        id: generateId(),
        resumeId: resume.id,
        jobDescriptionId: '',
        text: input.text as string,
        createdAt: new Date().toISOString(),
      };
      if (onCoverLetterGenerated) onCoverLetterGenerated(letter);
      return 'Cover letter generated and saved.';
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}
