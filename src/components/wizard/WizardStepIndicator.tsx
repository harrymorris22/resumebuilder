import { WIZARD_STEPS, WIZARD_STEP_LABELS, type WizardStep } from '../../types/wizard';
import { useAppStore } from '../../stores/useAppStore';

const stepIndex = (step: WizardStep) => WIZARD_STEPS.indexOf(step);

export function WizardStepIndicator() {
  const wizardStep = useAppStore((s) => s.wizardStep);
  const setWizardStep = useAppStore((s) => s.setWizardStep);
  const currentIdx = stepIndex(wizardStep);

  return (
    <nav
      role="navigation"
      aria-label="Wizard steps"
      className="flex items-center justify-center gap-0 px-6 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex-shrink-0"
    >
      {WIZARD_STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isCompleted = i < currentIdx;
        const isPast = i < currentIdx;

        return (
          <div key={step} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div
                className={`w-8 sm:w-12 h-0.5 ${
                  isPast ? 'bg-primary-600' : 'bg-stone-200 dark:bg-stone-700'
                }`}
              />
            )}

            {/* Step dot + label */}
            <button
              type="button"
              onClick={() => isPast ? setWizardStep(step) : undefined}
              disabled={!isPast}
              aria-current={isActive ? 'step' : undefined}
              aria-disabled={!isPast}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isCompleted
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 cursor-pointer group-hover:bg-primary-200 dark:group-hover:bg-primary-800'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`hidden sm:block text-[11px] font-medium whitespace-nowrap ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : isCompleted
                    ? 'text-stone-600 dark:text-stone-400'
                    : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                {WIZARD_STEP_LABELS[step]}
              </span>
            </button>
          </div>
        );
      })}

      {/* Mobile: show current step name */}
      <span className="sm:hidden ml-3 text-xs font-medium text-stone-600 dark:text-stone-400">
        {WIZARD_STEP_LABELS[wizardStep]}
      </span>
    </nav>
  );
}
