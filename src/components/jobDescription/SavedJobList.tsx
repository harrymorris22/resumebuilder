import type { JobDescription } from '../../types/resume';

interface SavedJobListProps {
  jobs: JobDescription[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedJobList({ jobs, activeId, onSelect, onDelete }: SavedJobListProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
        Saved Job Descriptions
      </h3>
      <div className="space-y-1.5">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
              activeId === job.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
            }`}
            onClick={() => onSelect(job.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                {job.title || 'Untitled Position'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {job.company || 'Unknown Company'} · {job.keywords.length} keywords
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job.id);
              }}
              className="p-1 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 transition-colors flex-shrink-0"
              aria-label={`Delete ${job.title}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
