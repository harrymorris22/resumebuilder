export type WizardStep =
  | 'content-pool'
  | 'recommendations'
  | 'job-description'
  | 'generate'
  | 'refine';

export const WIZARD_STEPS: WizardStep[] = [
  'content-pool',
  'recommendations',
  'job-description',
  'generate',
  'refine',
];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  'content-pool': 'Content Pool',
  'recommendations': 'Recommendations',
  'job-description': 'Job Description',
  'generate': 'Generate CV',
  'refine': 'Refine',
};
