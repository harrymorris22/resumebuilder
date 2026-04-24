import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { ApplicationStatus } from '../../types/resume';
import {
  activeCount,
  interviewsThisWeek,
  responseRate,
  offerRate,
  pipelineCounts,
  daysSince,
} from '../../utils/applicationStats';
import { TERMINAL_STATUSES } from '../../types/resume';
import { StatTile } from './StatTile';
import { PipelineSparkline } from './PipelineSparkline';
import { ApplicationsTable } from './ApplicationsTable';
import { ApplicationsKanban } from './ApplicationsKanban';
import { ApplicationDetailDrawer } from './ApplicationDetailDrawer';
import { FilterBar, EMPTY_FILTERS, type Filters } from './FilterBar';

type ViewMode = 'table' | 'kanban';

function matchesFilters(
  app: ReturnType<typeof useAppStore.getState>['applications'][number],
  filters: Filters,
  now: Date,
): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) return false;
  if (filters.companyQuery) {
    const q = filters.companyQuery.toLowerCase();
    if (!app.company.toLowerCase().includes(q) && !app.role.toLowerCase().includes(q)) return false;
  }
  if (filters.interviewsThisWeekOnly) {
    if (!app.nextStepDate) return false;
    const ts = Date.parse(app.nextStepDate);
    if (Number.isNaN(ts)) return false;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 7 * 24 * 60 * 60 * 1000;
    if (ts < start || ts >= end) return false;
    const relevant: ApplicationStatus[] = ['phone_screen', 'interview', 'final_round'];
    if (!relevant.includes(app.status)) return false;
  }
  return true;
}

interface ApplicationsPageProps {
  onClose: () => void;
  onOpenResume?: (resumeId: string) => void;
}

export function ApplicationsPage({ onClose, onOpenResume }: ApplicationsPageProps) {
  const applications = useAppStore((s) => s.applications);
  const addApplicationEvent = useAppStore((s) => s.addApplicationEvent);
  const setActiveResumeId = useAppStore((s) => s.setActiveResumeId);
  const setWizardStep = useAppStore((s) => s.setWizardStep);

  const [view, setView] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);

  const visible = useMemo(
    () => applications.filter((a) => matchesFilters(a, filters, now)),
    [applications, filters, now],
  );

  const stats = useMemo(
    () => ({
      active: activeCount(applications),
      thisWeek: interviewsThisWeek(applications, now),
      response: responseRate(applications),
      offer: offerRate(applications),
      pipeline: pipelineCounts(applications),
      totalClosed: applications.filter((a) => TERMINAL_STATUSES.includes(a.status)).length,
      // Safest seed is '' — ISO strings sort lexicographically so every real
      // updatedAt value beats it, and it avoids a direct index access.
      lastUpdated: applications.reduce(
        (acc, a) => (a.updatedAt > acc ? a.updatedAt : acc),
        '',
      ),
    }),
    [applications, now],
  );

  const handleOpenResume = useCallback(
    (resumeId: string) => {
      if (onOpenResume) {
        onOpenResume(resumeId);
      } else {
        setActiveResumeId(resumeId);
        setWizardStep('refine');
        onClose();
      }
    },
    [onOpenResume, setActiveResumeId, setWizardStep, onClose],
  );

  const handleStatusChange = useCallback(
    (appId: string, event: { id: string; status: ApplicationStatus; date: string }) => {
      addApplicationEvent(appId, event);
    },
    [addApplicationEvent],
  );

  if (applications.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <h3 className="font-display font-bold text-xl text-stone-900">No applications yet</h3>
        <p className="mt-2 text-sm text-stone-600 max-w-sm">
          Applications are created automatically when you generate a tailored resume
          from a job description.
        </p>
        <button
          type="button"
          onClick={() => {
            setWizardStep('content-pool');
            onClose();
          }}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Generate your first tailored resume
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile label="Active" value={stats.active} />
        <StatTile label="This week" value={stats.thisWeek} />
        <StatTile label="Response rate" value={`${Math.round(stats.response * 100)}%`} mono />
        <StatTile label="Offer rate" value={`${Math.round(stats.offer * 100)}%`} mono />
        <StatTile label="Closed" value={stats.totalClosed} />
      </div>
      <PipelineSparkline counts={stats.pipeline} />

      {/* Filter + view toggle row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <div className="flex items-center border border-stone-200 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-xs font-medium ${
              view === 'table' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-xs font-medium ${
              view === 'kanban' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      {/* Body */}
      {view === 'table' ? (
        <ApplicationsTable
          apps={visible}
          onRowClick={setDetailId}
          onStatusChange={handleStatusChange}
          onOpenResume={handleOpenResume}
        />
      ) : (
        <ApplicationsKanban
          apps={visible}
          onOpen={setDetailId}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Hint row */}
      <div className="text-[11px] font-mono text-stone-400 tabular-nums">
        Showing {visible.length} of {applications.length} · Updated{' '}
        {daysSince(stats.lastUpdated)}d ago
      </div>

      <ApplicationDetailDrawer
        applicationId={detailId}
        onClose={() => setDetailId(null)}
        onOpenResume={handleOpenResume}
      />
    </div>
  );
}
