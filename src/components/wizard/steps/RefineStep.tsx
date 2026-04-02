import { useState } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { useRecommendations } from '../../../hooks/useRecommendations';
import { useAnalyzeJobDescription } from '../../../hooks/useAnalyzeJobDescription';
import { RecommendationList } from '../../recommendations/RecommendationList';
import { ResumePreview } from '../../resume/ResumePreview';
import { DiffResumePreview } from '../../resume/DiffResumePreview';
import { ExportMenu } from '../../export/ExportMenu';
import { ContentPoolPage } from '../../contentPool/ContentPoolPage';
import { TemplateSelector } from '../../resume/TemplateSelector';
import { JobDescriptionForm } from '../../jobDescription/JobDescriptionForm';
import { SavedJobList } from '../../jobDescription/SavedJobList';

type LeftTab = 'suggestions' | 'content-pool' | 'job-description';

const TABS: { key: LeftTab; label: string }[] = [
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'content-pool', label: 'Content Pool' },
  { key: 'job-description', label: 'Job Description' },
];

export function RefineStep() {
  const apiKey = useAppStore((s) => s.apiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const generatedResumeId = useAppStore((s) => s.generatedResumeId);
  const activeJobDescriptionId = useAppStore((s) => s.activeJobDescriptionId);
  const setActiveJobDescriptionId = useAppStore((s) => s.setActiveJobDescriptionId);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);
  const resumes = useAppStore((s) => s.resumes);
  const updateRecommendation = useAppStore((s) => s.updateRecommendation);
  const removeJobDescription = useAppStore((s) => s.removeJobDescription);

  const {
    recommendations,
    isLoading,
    error,
    generateRefineRecommendations,
    executeRecommendation,
  } = useRecommendations();

  const { analyze, isLoading: isAnalyzing, error: jdError } = useAnalyzeJobDescription();

  const diffSnapshot = useAppStore((s) => s.diffSnapshot);
  const [showDiff, setShowDiff] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>('suggestions');

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
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 mb-2">
          Refine Your CV
        </h2>
        <p className="text-sm text-stone-500 max-w-md text-center mb-6">
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
        <h2 tabIndex={-1} className="text-2xl font-bold font-display text-stone-900 mb-2">
          Refine Your CV
        </h2>
        <p className="text-sm text-stone-500 max-w-md text-center mb-6">
          Go back to Step 3 and generate a CV first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="lg:w-[40%] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col min-h-0">
        {/* Header area */}
        <div className="p-6 pb-0 flex-shrink-0">
          <h2 tabIndex={-1} className="text-xl font-bold font-display text-stone-900 mb-1">
            Refine Your CV
          </h2>
          {activeJd && (
            <p className="text-sm text-stone-500 mb-4">
              {activeJd.title} at {activeJd.company}
            </p>
          )}

          {/* Export + Template + Diff toggle row */}
          <div className="flex items-center gap-3 mb-4">
            <ExportMenu />
            <TemplateSelector />
            {diffSnapshot && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={`ml-auto px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showDiff
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {showDiff ? 'Hide Changes' : 'Show Changes'}
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-stone-200" role="tablist" aria-label="Left panel tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={leftTab === tab.key}
                onClick={() => setLeftTab(tab.key)}
                className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                  leftTab === tab.key
                    ? 'text-primary-600'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
                {leftTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6" role="tabpanel">
          {leftTab === 'suggestions' && (
            <>
              {/* Error banner */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-stone-700">
                  AI Recommendations
                </h3>
                {!isLoading && recommendations.length > 0 && (
                  <button
                    onClick={generateRefineRecommendations}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Regenerate
                  </button>
                )}
              </div>

              <button
                onClick={generateRefineRecommendations}
                disabled={isLoading}
                className={`w-full mb-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLoading
                    ? 'bg-primary-600/50 text-white/70 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isLoading
                  ? 'Analyzing...'
                  : recommendations.length > 0
                  ? 'Refresh Suggestions'
                  : 'Get AI Suggestions'}
              </button>

              <RecommendationList
                recommendations={recommendations}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                isLoading={isLoading}
              />
            </>
          )}

          {leftTab === 'content-pool' && (
            <ContentPoolPage showCheckboxes={true} />
          )}

          {leftTab === 'job-description' && (
            <>
              {jdError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                  {jdError}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-stone-700 mb-2">
                  New Job Description
                </h3>
                <JobDescriptionForm onSubmit={analyze} isLoading={isAnalyzing} />
              </div>

              <SavedJobList
                jobs={jobDescriptions}
                activeId={activeJobDescriptionId}
                onSelect={(id) => setActiveJobDescriptionId(id)}
                onDelete={(id) => removeJobDescription(id)}
              />

              {activeJd && (
                <div className="mt-6 p-4 border border-primary-200 bg-primary-50/50 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-stone-800">
                        {activeJd.title} at {activeJd.company}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {activeJd.keywords.length} keywords extracted
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded">
                      SELECTED
                    </span>
                  </div>
                  {activeJd.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeJd.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-white border border-stone-200 text-stone-600 rounded"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right panel: resume preview or diff view */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-stone-100">
        {showDiff && diffSnapshot ? (
          <DiffResumePreview snapshot={diffSnapshot} />
        ) : (
          <ResumePreview />
        )}
      </div>
    </div>
  );
}
