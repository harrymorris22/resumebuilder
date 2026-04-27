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
  description?: string;
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

// Content Pool — individual bullets/items shared across all resume versions
export type ContentPoolItemType = 'contact' | 'summary' | 'bullet' | 'education' | 'skill_category' | 'project' | 'certification';

export type ContentPoolItemData =
  | { type: 'contact'; data: ContactInfo }
  | { type: 'summary'; data: { text: string } }
  | { type: 'bullet'; data: { text: string }; context: { company: string; title: string; description?: string; startDate: string; endDate: string | null } }
  | { type: 'education'; data: EducationItem }
  | { type: 'skill_category'; data: SkillCategory }
  | { type: 'project'; data: ProjectItem }
  | { type: 'certification'; data: CertificationItem };

export interface ContentPoolEntry {
  id: string;
  item: ContentPoolItemData;
  source: 'upload' | 'ai' | 'user';
  createdAt: string;
  updatedAt: string;
}

// Legacy — kept for backward compat during transition
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

export type CoverLetterTone = 'professional' | 'conversational' | 'technical';

export interface CoverLetter {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  text: string;
  tone?: CoverLetterTone;
  createdAt: string;
}

export interface InterviewQuestions {
  id: string;
  // Scopes questions to the resume that generated them. Two resumes targeting
  // the same JD should each have their own questions — keying by JD alone
  // caused cross-resume leakage (see v0.7.0.1).
  resumeId: string;
  jobDescriptionId: string;
  companyUrl?: string;
  questions: string[];
  createdAt: string;
}

export interface InterviewPrep {
  id: string;                              // always 'default' — single global record
  answers: Record<string, string[]>;       // questionId → array of bullets
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Applications — each generated resume becomes a first-class Application with
// status tracking through the interview pipeline. 1:1 resume↔application.
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted';

export const TERMINAL_STATUSES: readonly ApplicationStatus[] = [
  'rejected',
  'withdrawn',
  'ghosted',
] as const;

// Active (non-terminal, post-draft) statuses. First transition into one of these
// sets `appliedAt`. Transitions into terminal statuses do NOT set `appliedAt`
// because the user never actually applied.
export const ACTIVE_STATUSES: readonly ApplicationStatus[] = [
  'applied',
  'phone_screen',
  'interview',
  'final_round',
  'offer',
] as const;

// Ordered non-terminal pipeline stages, used by kanban and sparkline.
export const PIPELINE_STAGES: readonly ApplicationStatus[] = [
  'draft',
  'applied',
  'phone_screen',
  'interview',
  'final_round',
  'offer',
] as const;

export interface ApplicationEvent {
  id: string;
  status: ApplicationStatus;
  date: string; // ISO
  note?: string;
}

export interface Application {
  id: string;
  resumeId: string; // → Resume.id (1:1)
  jobDescriptionId: string; // → JobDescription.id (denormalized)
  company: string; // snapshot, editable
  role: string; // snapshot, editable
  status: ApplicationStatus; // == events[events.length-1].status
  appliedAt: string | null; // set on first transition into an ACTIVE status
  jobUrl?: string;
  salary?: string;
  location?: string;
  contact?: string;
  nextStepDate?: string | null;
  events: ApplicationEvent[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Patch type for updateApplication — excludes fields that must flow through
// addApplicationEvent (status/events/appliedAt) or are immutable (id/resumeId/
// createdAt) or managed by the store (updatedAt).
export type ApplicationPatch = Partial<
  Omit<
    Application,
    'id' | 'resumeId' | 'status' | 'events' | 'appliedAt' | 'updatedAt' | 'createdAt'
  >
>;
