import { getClient } from './anthropic';
import { generateId } from '../utils/id';
import type { Resume, ResumeSection } from '../types/resume';

export async function extractText(file: File): Promise<string> {
  const type = file.type;

  if (type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? (item as { str: string }).str : '')).join(' '));
    }
    return pages.join('\n\n');
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword' ||
    file.name.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }

  // Plain text fallback
  return file.text();
}

const PARSE_TOOL = {
  name: 'create_resume' as const,
  description: 'Create a structured resume from the extracted text',
  input_schema: {
    type: 'object' as const,
    required: ['contact', 'summary', 'experience', 'education', 'skills'],
    properties: {
      name: { type: 'string' as const, description: 'A short name for the resume, e.g. "John Doe Resume"' },
      contact: {
        type: 'object' as const,
        properties: {
          fullName: { type: 'string' as const },
          email: { type: 'string' as const },
          phone: { type: 'string' as const },
          location: { type: 'string' as const },
          linkedin: { type: 'string' as const },
          github: { type: 'string' as const },
          website: { type: 'string' as const },
        },
        required: ['fullName', 'email', 'phone', 'location'],
      },
      summary: { type: 'string' as const, description: 'Professional summary text' },
      experience: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            company: { type: 'string' as const },
            title: { type: 'string' as const },
            location: { type: 'string' as const },
            startDate: { type: 'string' as const },
            endDate: { type: 'string' as const, description: 'End date or "Present"' },
            bullets: { type: 'array' as const, items: { type: 'string' as const } },
          },
          required: ['company', 'title', 'startDate', 'bullets'],
        },
      },
      education: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            institution: { type: 'string' as const },
            degree: { type: 'string' as const },
            field: { type: 'string' as const },
            startDate: { type: 'string' as const },
            endDate: { type: 'string' as const },
            gpa: { type: 'string' as const },
          },
          required: ['institution', 'degree', 'field'],
        },
      },
      skills: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const, description: 'Category name, e.g. "Programming Languages"' },
            skills: { type: 'array' as const, items: { type: 'string' as const } },
          },
          required: ['name', 'skills'],
        },
      },
      certifications: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            issuer: { type: 'string' as const },
            date: { type: 'string' as const },
          },
          required: ['name', 'issuer'],
        },
      },
      projects: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            description: { type: 'string' as const },
            technologies: { type: 'array' as const, items: { type: 'string' as const } },
            bullets: { type: 'array' as const, items: { type: 'string' as const } },
          },
          required: ['name', 'description'],
        },
      },
    },
  },
};

interface ParsedResume {
  name?: string;
  contact: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills: Array<{
    name: string;
    skills: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    bullets?: string[];
  }>;
}

export async function parseResumeWithClaude(text: string, apiKey: string): Promise<Resume> {
  const client = getClient(apiKey);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: 'You are a resume parser. Extract all information from the provided resume text into a structured format. Be thorough — capture every detail. Use the create_resume tool to return the structured data. If a field is not present in the resume, use an empty string or empty array.',
    messages: [
      {
        role: 'user',
        content: `Parse the following resume text and extract all structured information:\n\n${text}`,
      },
    ],
    tools: [PARSE_TOOL],
    tool_choice: { type: 'tool', name: 'create_resume' },
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Failed to parse resume — no structured data returned');
  }

  const parsed = toolBlock.input as ParsedResume;
  const now = new Date().toISOString();

  const sections: ResumeSection[] = [
    {
      id: generateId(),
      order: 0,
      visible: true,
      content: {
        type: 'contact',
        data: {
          fullName: parsed.contact.fullName || '',
          email: parsed.contact.email || '',
          phone: parsed.contact.phone || '',
          location: parsed.contact.location || '',
          linkedin: parsed.contact.linkedin,
          github: parsed.contact.github,
          website: parsed.contact.website,
        },
      },
    },
    {
      id: generateId(),
      order: 1,
      visible: true,
      content: {
        type: 'summary',
        data: { text: parsed.summary || '' },
      },
    },
    {
      id: generateId(),
      order: 2,
      visible: true,
      content: {
        type: 'experience',
        data: {
          items: (parsed.experience || []).map((exp) => ({
            id: generateId(),
            company: exp.company,
            title: exp.title,
            location: exp.location || '',
            dateRange: {
              start: exp.startDate || '',
              end: exp.endDate === 'Present' ? null : (exp.endDate || null),
            },
            bullets: exp.bullets || [],
          })),
        },
      },
    },
    {
      id: generateId(),
      order: 3,
      visible: true,
      content: {
        type: 'education',
        data: {
          items: (parsed.education || []).map((edu) => ({
            id: generateId(),
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            dateRange: {
              start: edu.startDate || '',
              end: edu.endDate || null,
            },
            gpa: edu.gpa,
          })),
        },
      },
    },
    {
      id: generateId(),
      order: 4,
      visible: true,
      content: {
        type: 'skills',
        data: {
          categories: (parsed.skills || []).map((cat) => ({
            id: generateId(),
            name: cat.name,
            skills: cat.skills,
          })),
        },
      },
    },
    {
      id: generateId(),
      order: 5,
      visible: true,
      content: {
        type: 'certifications',
        data: {
          items: (parsed.certifications || []).map((cert) => ({
            id: generateId(),
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date || '',
          })),
        },
      },
    },
  ];

  // Add projects section if present
  if (parsed.projects && parsed.projects.length > 0) {
    sections.push({
      id: generateId(),
      order: 6,
      visible: true,
      content: {
        type: 'projects',
        data: {
          items: parsed.projects.map((proj) => ({
            id: generateId(),
            name: proj.name,
            description: proj.description,
            technologies: proj.technologies || [],
            bullets: proj.bullets || [],
          })),
        },
      },
    });
  }

  return {
    id: generateId(),
    name: parsed.name || `${parsed.contact.fullName || 'Uploaded'} Resume`,
    createdAt: now,
    updatedAt: now,
    templateId: 'classic',
    sections,
  };
}
