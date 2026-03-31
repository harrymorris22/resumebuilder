import { WIZARD_STEPS, type WizardStep } from '../../types/wizard';
import { useAppStore } from '../../stores/useAppStore';

function canAdvance(step: WizardStep, state: { contentPool: unknown[]; activeJobDescriptionId: string | null; generatedResumeId: string | null }): boolean {
  switch (step) {
    case 'content-pool':
      return state.contentPool.length > 0;
    case 'job-description':
      return state.activeJobDescriptionId !== null;
    case 'generate':
      return state.generatedResumeId !== null;
    case 'refine':
      return false; // last step, no next
    default:
      return false;
  }
}

export function WizardNav() {
  const wizardStep = useAppStore((s) => s.wizardStep);
  const setWizardStep = useAppStore((s) => s.setWizardStep);
  const contentPool = useAppStore((s) => s.contentPool);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);

  const currentIdx = WIZARD_STEPS.indexOf(wizardStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;
  const nextEnabled = canAdvance(wizardStep, { contentPool, activeJobDescriptionId, generatedResumeId });

  const goBack = () => {
    if (!isFirst) {
      setWizardStep(WIZARD_STEPS[currentIdx - 1]);
    }
  };

  const goNext = () => {
    if (!isLast && nextEnabled) {
      setWizardStep(WIZARD_STEPS[currentIdx + 1]);
    }
  };

  return (
    <div className="h-14 flex-shrink-0 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-between px-6">
      {/* Back button */}
      <button
        type="button"
        onClick={goBack}
        disabled={isFirst}
        className={`px-4 py-2 text-sm rounded-md transition-colors ${
          isFirst
            ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
      >
        Back
      </button>

      {/* Step dots (center) */}
      <div className="flex items-center gap-1.5">
        {WIZARD_STEPS.map((step, i) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIdx
                ? 'bg-primary-600'
                : i < currentIdx
                ? 'bg-primary-300 dark:bg-primary-700'
                : 'bg-stone-200 dark:bg-stone-700'
            }`}
          />
        ))}
      </div>

      {/* Next button */}
      {!isLast ? (
        <button
          type="button"
          onClick={goNext}
          disabled={!nextEnabled}
          aria-disabled={!nextEnabled}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            nextEnabled
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-primary-600/50 text-white/70 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      ) : (
        <div className="w-16" /> // Spacer for alignment
      )}
    </div>
  );
}
