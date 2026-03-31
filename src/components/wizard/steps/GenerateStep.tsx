import { useAppStore } from '../../../stores/useAppStore';
import { useGenerateResume } from '../../../hooks/useGenerateResume';
import { ResumePreview } from '../../resume/ResumePreview';
import { TemplateSelector } from '../../resume/TemplateSelector';
import type { GenerationSection } from '../../../hooks/useGenerateResume';

function ProgressChecklist({ sections }: { sections: GenerationSection[] }) {
  return (
    <div className="space-y-1.5">
      {sections.map((section) => (
        <div key={section.name} className="flex items-center gap-2 text-sm">
          {section.status === 'done' ? (
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : section.status === 'in-progress' ? (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-stone-200 dark:border-stone-600 flex-shrink-0" />
          )}
          <span
            className={`font-mono text-xs ${
              section.status === 'done'
                ? 'text-emerald-600 dark:text-emerald-400'
                : section.status === 'in-progress'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-stone-400 dark:text-stone-500'
            }`}
          >
            {section.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function GenerateStep() {
  const apiKey = useAppStore((s) => s.apiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);

  const {
    generate,
    isGenerating,
    error,
    warning,
    sections,
  } = useGenerateResume();

  const activeJd = jobDescriptions.find((j) => j.id === activeJobDescriptionId);
  const hasGenerated = !!generatedResumeId;

  if (!apiKey) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-16">
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2">
          Generate CV
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          Enter your API key to generate tailored resumes with AI.
        </p>
        <button
          onClick={() => setSettingsOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
        >
          Set Up API Key
        </button>
      </div>
    );
  }

  // Once generated, show split view with resume preview
  if (hasGenerated && !isGenerating) {
    return (
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Left panel: controls */}
        <div className="lg:w-[40%] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-700 overflow-y-auto p-6">
          <h2 tabIndex={-1} className="text-xl font-bold font-display text-stone-900 dark:text-white mb-1">
            Your CV is ready
          </h2>
          {activeJd && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              Tailored for {activeJd.title} at {activeJd.company}
            </p>
          )}

          {warning && (
            <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-md text-sm">
              {warning}
            </div>
          )}

          {/* Section completion summary */}
          <div className="mb-4">
            <ProgressChecklist sections={sections} />
          </div>

          {/* Template selector */}
          <div className="mb-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
              Template
            </h3>
            <TemplateSelector />
          </div>

          {/* Regenerate */}
          <button
            onClick={() => generate()}
            disabled={isGenerating}
            className="w-full px-4 py-2 text-sm text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-600 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Regenerate CV
          </button>
        </div>

        {/* Right panel: resume preview */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-stone-100 dark:bg-stone-950">
          <ResumePreview />
        </div>
      </div>
    );
  }

  // Pre-generation or generating state
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-16">
      <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2">
        Generate CV
      </h2>

      {activeJd ? (
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          The AI will select the best items from your content pool and compose a
          targeted 1-page resume for <strong className="text-stone-700 dark:text-stone-300">{activeJd.title}</strong> at <strong className="text-stone-700 dark:text-stone-300">{activeJd.company}</strong>.
        </p>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          Go back to Step 3 and select a job description first.
        </p>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-sm max-w-md w-full">
          {error}
        </div>
      )}

      {isGenerating ? (
        <div className="w-full max-w-xs">
          <div className="mb-4 text-center">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Building your resume...
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              This takes 15-30 seconds
            </p>
          </div>
          <ProgressChecklist sections={sections} />
        </div>
      ) : (
        activeJd && (
          <button
            onClick={() => generate()}
            className="px-6 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
          >
            Generate CV
          </button>
        )
      )}
    </div>
  );
}
