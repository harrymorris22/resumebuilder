import { useAppStore } from '../../../stores/useAppStore';
import { useRecommendations } from '../../../hooks/useRecommendations';
import { RecommendationList } from '../../recommendations/RecommendationList';

export function RecommendationsStep() {
  const apiKey = useAppStore((s) => s.apiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const contentPool = useAppStore((s) => s.contentPool);
  const clearRecommendations = useAppStore((s) => s.clearRecommendations);
  const updateRecommendation = useAppStore((s) => s.updateRecommendation);

  const {
    recommendations,
    isLoading,
    error,
    generatePoolRecommendations,
    executeRecommendation,
  } = useRecommendations();

  const hasRecs = recommendations.length > 0;

  const handleAccept = (id: string) => {
    executeRecommendation(id);
  };

  const handleDismiss = (id: string) => {
    updateRecommendation(id, { status: 'dismissed' });
  };

  // No API key: show inline setup
  if (!apiKey) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-16">
        <h2
          tabIndex={-1}
          className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-2"
        >
          AI Recommendations
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md text-center mb-6">
          Enter your Anthropic API key to use AI features. Your key is stored locally
          in your browser and never sent anywhere except Anthropic's API.
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
        <h2
          tabIndex={-1}
          className="text-2xl font-bold font-display text-stone-900 dark:text-white mb-1"
        >
          AI Recommendations
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          {hasRecs
            ? `${recommendations.filter((r) => r.status !== 'dismissed').length} suggestions for improving your content pool.`
            : `Analyze your ${contentPool.length} pool items for improvements.`}
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={generatePoolRecommendations}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline ml-3"
            >
              Retry
            </button>
          </div>
        )}

        {/* Generate button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={generatePoolRecommendations}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isLoading
                ? 'bg-primary-600/50 text-white/70 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isLoading ? 'Analyzing...' : hasRecs ? 'Regenerate' : 'Generate Recommendations'}
          </button>

          {hasRecs && !isLoading && (
            <button
              onClick={clearRecommendations}
              className="px-3 py-2 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Recommendations list */}
        <RecommendationList
          recommendations={recommendations}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />

        {/* Empty state (no recs, not loading) */}
        {!hasRecs && !isLoading && !error && (
          <div className="text-center py-12">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Click Generate to get AI-powered feedback on your content pool.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
