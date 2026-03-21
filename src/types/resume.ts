export type SectionType =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'custom';

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'creative';

export interface DateRange {
  start: string;
  end: string | null; // null = "Present"
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location: string;
  dateRange: DateRange;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  dateRange: DateRange;
  gpa?: string;
  honors?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface SkillsData {
  categories: SkillCategory[];
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  dateRange?: DateRange;
  bullets: string[];
}

export interface CustomSectionData {
  heading: string;
  items: CustomSectionItem[];
}

export type SectionContent =
  | { type: 'contact'; data: ContactInfo }
  | { type: 'summary'; data: { text: string } }
  | { type: 'experience'; data: { items: ExperienceItem[] } }
  | { type: 'education'; data: { items: EducationItem[] } }
  | { type: 'skills'; data: SkillsData }
  | { type: 'projects'; data: { items: ProjectItem[] } }
  | { type: 'certifications'; data: { items: CertificationItem[] } }
  | { type: 'custom'; data: CustomSectionData };

export interface ResumeSection {
  id: string;
  order: number;
  visible: boolean;
  content: SectionContent;
}

export interface Resume {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  templateId: TemplateId;
  sections: ResumeSection[];
  targetJobId?: string;
}

export interface ContentBankItem {
  id: string;
  type: 'bullet' | 'summary' | 'skill' | 'experience' | 'project';
  text: string;
  tags: string[];
  source: 'ai' | 'user';
  createdAt: string;
  superseded?: boolean;
  supersedesId?: string;
  metadata?: {
    company?: string;
    role?: string;
  };
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  rawText: string;
  keywords: string[];
  createdAt: string;
}

export interface CoverLetter {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  text: string;
  createdAt: string;
}
