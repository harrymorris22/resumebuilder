import { useAppStore } from '../../../stores/useAppStore';
import { useRecommendations } from '../../../hooks/useRecommendations';
import { RecommendationList } from '../../recommendations/RecommendationList';
import { ResumePreview } from '../../resume/ResumePreview';
import { ExportMenu } from '../../export/ExportMenu';

export function RefineStep() {
  const apiKey = useAppStore((s) => s.apiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);
  const resumes = useAppStore((s) => s.resumes);
  const updateRecommendation = useAppStore((s) => s.updateRecommendation);

  const {
    recommendations,
    isLoading,
    error,
    generateRefineRecommendations,
    executeRecommendation,
  } = useRecommendations();

  const activeJd = jobDescriptions.find((j) => j.id === activeJobDescriptionId);
  const generatedResume = resumes.find((r) => r.id === generatedResumeId);

  const handleAccept = (id: string) => {
    executeRecommendation(id);
  };

  const handleDismiss = (id: string) => {
    updateRecommendation(id, { status: 'dismissed' });
  };

  if (!apiKey) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-16">
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2">
          Refine Your CV
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          Enter your API key to get AI refinement suggestions.
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

  if (!generatedResume) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-16">
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2">
          Refine Your CV
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          Go back to Step 4 and generate a CV first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
      {/* Left panel: recommendations + export */}
      <div className="lg:w-[40%] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-700 overflow-y-auto">
        <div className="p-6">
          <h2 tabIndex={-1} className="text-xl font-bold font-display text-stone-900 dark:text-white mb-1">
            Refine Your CV
          </h2>
          {activeJd && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              AI suggestions for {activeJd.title} at {activeJd.company}
            </p>
          )}

          {/* Export button — prominent */}
          <div className="mb-6">
            <ExportMenu />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Generate refinement recs */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={generateRefineRecommendations}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isLoading
                  ? 'bg-primary-600/50 text-white/70 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isLoading
                ? 'Analyzing...'
                : recommendations.length > 0
                ? 'Regenerate Suggestions'
                : 'Get Refinement Suggestions'}
            </button>
          </div>

          {/* Recommendations list */}
          <RecommendationList
            recommendations={recommendations}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
            isLoading={isLoading}
          />

          {/* Empty state */}
          {!isLoading && recommendations.length === 0 && !error && (
            <div className="text-center py-8">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                Click above to get AI suggestions for polishing your CV against the job description.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: resume preview */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-stone-100 dark:bg-stone-950">
        <ResumePreview />
      </div>
    </div>
  );
}
