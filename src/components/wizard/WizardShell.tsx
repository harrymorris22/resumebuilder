import { useAppStore } from '../../stores/useAppStore';
import { WizardStepIndicator } from './WizardStepIndicator';
import { WizardNav } from './WizardNav';
import { ContentPoolStep } from './steps/ContentPoolStep';
import { RecommendationsStep } from './steps/RecommendationsStep';
import { JobDescriptionStep } from './steps/JobDescriptionStep';
import { GenerateStep } from './steps/GenerateStep';
import { RefineStep } from './steps/RefineStep';

function StepBody() {
  const wizardStep = useAppStore((s) => s.wizardStep);

  switch (wizardStep) {
    case 'content-pool':
      return <ContentPoolStep />;
    case 'recommendations':
      return <RecommendationsStep />;
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

export function WizardShell() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <WizardStepIndicator />
      <StepBody />
      <WizardNav />
    </div>
  );
}
