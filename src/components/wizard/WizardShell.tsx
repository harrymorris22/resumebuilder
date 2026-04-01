import { useAppStore } from '../../stores/useAppStore';
import { WizardStepIndicator } from './WizardStepIndicator';
import { WizardNav } from './WizardNav';
import { ContentPoolStep } from './steps/ContentPoolStep';
import { JobDescriptionStep } from './steps/JobDescriptionStep';
import { GenerateStep } from './steps/GenerateStep';
import { RefineStep } from './steps/RefineStep';

function StepBody() {
  const wizardStep = useAppStore((s) => s.wizardStep);

  switch (wizardStep) {
    case 'content-pool':
      return <ContentPoolStep />;
    case 'job-description':
      return <JobDescriptionStep />;
    case 'generate':
      return <GenerateStep />;
    case 'refine':
      return <RefineStep />;
    default:
      return <ContentPoolStep />;
  }
}

function ResumeTitle() {
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const resume = resumes.find((r) => r.id === activeResumeId);
  if (!resume) return null;

  return (
    <div className="px-6 pt-3 pb-1 bg-white border-b border-stone-100 flex-shrink-0">
      <h1 className="text-sm font-semibold text-stone-800 text-center truncate">
        {resume.name}
      </h1>
    </div>
  );
}

export function WizardShell() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ResumeTitle />
      <WizardStepIndicator />
      <StepBody />
      <WizardNav />
    </div>
  );
}
