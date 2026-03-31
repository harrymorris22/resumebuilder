import type { Recommendation } from '../../types/recommendation';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  isLoading: boolean;
}

export function RecommendationList({ recommendations, onAccept, onDismiss, isLoading }: RecommendationListProps) {
  const visible = recommendations.filter((r) => r.status !== 'dismissed');
  const addressed = visible.filter((r) => r.status === 'accepted').length;
  const total = visible.length;

  if (isLoading && visible.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md p-3">
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-16 bg-stone-200 dark:bg-stone-700 rounded" />
              <div className="h-4 w-full bg-stone-200 dark:bg-stone-700 rounded" />
              <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded" />
            </div>
          </div>
        ))}
        <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
          Analyzing your content pool...
        </p>
      </div>
    );
  }

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (addressed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">
            {addressed} of {total}
          </span>
        </div>
      )}

      {/* Cards */}
      <div role="list" className="space-y-2">
        {visible.map((rec) => (
          <div key={rec.id} role="listitem">
            <RecommendationCard
              recommendation={rec}
              onAccept={onAccept}
              onDismiss={onDismiss}
            />
          </div>
        ))}
      </div>

      {addressed === total && total > 0 && (
        <div className="text-center py-3">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            All recommendations addressed!
          </p>
        </div>
      )}
    </div>
  );
}
