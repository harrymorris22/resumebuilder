import type Anthropic from '@anthropic-ai/sdk';

export type ToolDefinition = Anthropic.Messages.Tool;

export const resumeTools: ToolDefinition[] = [
  {
    name: 'update_contact',
    description:
      'Update the contact information section of the resume. Call this when you learn the user\'s name, email, phone, location, or links.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fullName: { type: 'string', description: 'Full name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        location: { type: 'string', description: 'City, State' },
        linkedin: { type: 'string', description: 'LinkedIn URL' },
        github: { type: 'string', description: 'GitHub URL' },
        website: { type: 'string', description: 'Personal website URL' },
      },
      required: [],
    },
  },
  {
    name: 'set_summary',
    description:
      'Set or update the professional summary section. Call this when you have crafted a summary for the user.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'The professional summary text' },
      },
      required: ['text'],
    },
  },
  {
    name: 'add_experience',
    description:
      'Add a new work experience entry to the resume. Call this when the user describes a job they have held.',
    input_schema: {
      type: 'object' as const,
      properties: {
        company: { type: 'string', description: 'Company name' },
        title: { type: 'string', description: 'Job title' },
        location: { type: 'string', description: 'Job location' },
        startDate: { type: 'string', description: 'Start date (e.g. Jan 2020)' },
        endDate: {
          type: 'string',
          description: 'End date (e.g. Dec 2023) or null for current position',
          nullable: true,
        },
        bullets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Achievement bullet points',
        },
      },
      required: ['company', 'title', 'bullets'],
    },
  },
  {
    name: 'update_experience_bullets',
    description:
      'Update the bullet points for an existing experience entry. Use this to refine or improve bullets.',
    input_schema: {
      type: 'object' as const,
      properties: {
        experienceId: { type: 'string', description: 'The ID of the experience item to update' },
        bullets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated bullet points',
        },
      },
      required: ['experienceId', 'bullets'],
    },
  },
  {
    name: 'add_education',
    description: 'Add an education entry to the resume.',
    input_schema: {
      type: 'object' as const,
      properties: {
        institution: { type: 'string', description: 'Institution name' },
        degree: { type: 'string', description: 'Degree type (e.g. B.S., M.A.)' },
        field: { type: 'string', description: 'Field of study' },
        startDate: { type: 'string', description: 'Start date' },
        endDate: { type: 'string', description: 'End date or null', nullable: true },
        gpa: { type: 'string', description: 'GPA (optional)' },
      },
      required: ['institution', 'degree', 'field'],
    },
  },
  {
    name: 'add_skills',
    description:
      'Add skills to the resume. Creates a new skill category or adds to an existing one.',
    input_schema: {
      type: 'object' as const,
      properties: {
        categoryName: { type: 'string', description: 'Skill category name (e.g. Programming Languages, Tools)' },
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of skills to add',
        },
      },
      required: ['categoryName', 'skills'],
    },
  },
  {
    name: 'add_certification',
    description: 'Add a certification to the resume.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Certification name' },
        issuer: { type: 'string', description: 'Issuing organization' },
        date: { type: 'string', description: 'Date obtained' },
        url: { type: 'string', description: 'Verification URL (optional)' },
      },
      required: ['name', 'issuer', 'date'],
    },
  },
  {
    name: 'add_project',
    description: 'Add a project entry to the resume.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Brief description' },
        technologies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technologies used',
        },
        url: { type: 'string', description: 'Project URL (optional)' },
        bullets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key achievements/details',
        },
      },
      required: ['name', 'description', 'bullets'],
    },
  },
  {
    name: 'add_to_content_bank',
    description:
      'Save a piece of content to the content bank for future reuse. Always save good bullets, summaries, and skills here.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['bullet', 'summary', 'skill', 'experience', 'project'],
          description: 'Type of content',
        },
        text: { type: 'string', description: 'The content text' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        metadata: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            role: { type: 'string' },
          },
          description: 'Optional metadata',
        },
      },
      required: ['type', 'text', 'tags'],
    },
  },
  {
    name: 'suggest_star_rewrite',
    description:
      'Suggest a STAR-format rewrite of a resume bullet point. Present the original and improved version for the user to accept or reject.',
    input_schema: {
      type: 'object' as const,
      properties: {
        originalText: { type: 'string', description: 'The original bullet point text' },
        starText: { type: 'string', description: 'The STAR-formatted improved version' },
        sectionId: { type: 'string', description: 'Section ID containing the bullet' },
        itemId: { type: 'string', description: 'Experience/project item ID' },
        bulletIndex: { type: 'number', description: 'Index of the bullet in the item' },
      },
      required: ['originalText', 'starText'],
    },
  },
  {
    name: 'analyze_job_description',
    description:
      'Analyze a job description to extract title, company, and keywords. Call this when the user pastes a job description in job customisation mode.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Job title extracted from the JD' },
        company: { type: 'string', description: 'Company name extracted from the JD' },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Important keywords and skills from the JD (include synonym variants)',
        },
      },
      required: ['title', 'company', 'keywords'],
    },
  },
  {
    name: 'suggest_bank_item',
    description:
      'Suggest a content bank item that would be relevant for the current job description. Present it with a reason and target section.',
    input_schema: {
      type: 'object' as const,
      properties: {
        bankItemId: { type: 'string', description: 'ID of the content bank item to suggest' },
        reason: { type: 'string', description: 'Why this item is relevant to the job' },
        targetSection: { type: 'string', description: 'Which resume section this should go in' },
      },
      required: ['bankItemId', 'reason'],
    },
  },
  {
    name: 'generate_cover_letter',
    description:
      'Generate a cover letter for the current job description. Call this after all resume suggestions have been resolved.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'The full cover letter text' },
      },
      required: ['text'],
    },
  },
];
