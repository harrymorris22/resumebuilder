import { useAppStore } from '../../../stores/useAppStore';
import { useAnalyzeJobDescription } from '../../../hooks/useAnalyzeJobDescription';
import { JobDescriptionForm } from '../../jobDescription/JobDescriptionForm';
import { SavedJobList } from '../../jobDescription/SavedJobList';

export function JobDescriptionStep() {
  const apiKey = useAppStore((s) => s.apiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const setActiveJobDescriptionId = useAppStore((s) => s.setActiveJobDescriptionId);
  const removeJobDescription = useAppStore((s) => s.removeJobDescription);
  const { analyze, isLoading: isAnalyzing, error } = useAnalyzeJobDescription();

  const activeJd = jobDescriptions.find((j) => j.id === activeJobDescriptionId);

  const handleSelectJd = (id: string) => {
    setActiveJobDescriptionId(id);
  };

  if (!apiKey) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-16">
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2">
          Job Description
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          Enter your API key to analyze job descriptions with AI.
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

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-1">
          Job Description
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          Paste a job posting. The AI will extract keywords and suggest how to strengthen your content pool for this role.
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form for new JD */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            New Job Description
          </h3>
          <JobDescriptionForm onSubmit={analyze} isLoading={isAnalyzing} />
        </div>

        {/* Saved job descriptions */}
        <SavedJobList
          jobs={jobDescriptions}
          activeId={activeJobDescriptionId}
          onSelect={handleSelectJd}
          onDelete={(id) => removeJobDescription(id)}
        />

        {/* Selected JD details */}
        {activeJd && (
          <div className="mt-6 p-4 border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {activeJd.title} at {activeJd.company}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeJd.keywords.length} keywords extracted
                </p>
              </div>
              <span className="text-[10px] font-medium px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                SELECTED
              </span>
            </div>

            {/* Keyword chips */}
            {activeJd.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeJd.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 rounded"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state when no JDs and not loading */}
        {jobDescriptions.length === 0 && !isAnalyzing && !error && (
          <div className="text-center py-8">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              No saved job descriptions yet. Paste one above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
