import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { ApplicationStatus } from '../../types/resume';
import { ALL_STATUSES, STATUS_LABELS } from './StatusPill';

export interface Filters {
  statuses: ApplicationStatus[]; // empty = all
  companyQuery: string;
  interviewsThisWeekOnly: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const EMPTY_FILTERS: Filters = {
  statuses: [],
  companyQuery: '',
  interviewsThisWeekOnly: false,
};

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [queryLocal, setQueryLocal] = useState(filters.companyQuery);
  const debounceRef = useRef<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  // Refs always hold the latest values so the debounce closure reads current
  // state when it fires — without these, typing then immediately ticking a
  // status checkbox within 200ms would silently clobber the status selection.
  const filtersRef = useRef(filters);
  const onChangeRef = useRef(onChange);
  // Keep refs in sync with latest props so the debounce closure always reads
  // current values — without this, typing then ticking a status checkbox within
  // 200ms would silently clobber the status selection.
  useLayoutEffect(() => {
    filtersRef.current = filters;
    onChangeRef.current = onChange;
  });

  // Debounce company search by 200ms.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (queryLocal !== filtersRef.current.companyQuery) {
        onChangeRef.current({ ...filtersRef.current, companyQuery: queryLocal });
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [queryLocal]);

  // Close status popover on outside click.
  useEffect(() => {
    if (!statusOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [statusOpen]);

  function toggleStatus(s: ApplicationStatus) {
    const has = filters.statuses.includes(s);
    const next = has ? filters.statuses.filter((x) => x !== s) : [...filters.statuses, s];
    onChange({ ...filters, statuses: next });
  }

  function clearAll() {
    onChange(EMPTY_FILTERS);
    setQueryLocal('');
  }

  const activeFilterCount =
    filters.statuses.length +
    (filters.companyQuery ? 1 : 0) +
    (filters.interviewsThisWeekOnly ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status multi-select */}
      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setStatusOpen((o) => !o)}
          className="px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-200 rounded-md hover:bg-stone-50 flex items-center gap-1.5"
        >
          Status
          {filters.statuses.length > 0 && (
            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 rounded">
              {filters.statuses.length}
            </span>
          )}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {statusOpen && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-stone-200 rounded-md shadow-md z-10 py-1 min-w-[180px]">
            {ALL_STATUSES.map((s) => {
              const checked = filters.statuses.includes(s);
              return (
                <label
                  key={s}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-stone-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStatus(s)}
                    className="accent-blue-600"
                  />
                  {STATUS_LABELS[s]}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Company search */}
      <input
        type="text"
        placeholder="Search company..."
        value={queryLocal}
        onChange={(e) => setQueryLocal(e.target.value)}
        className="px-3 py-1.5 text-xs text-stone-700 border border-stone-200 rounded-md focus:outline-none focus:border-blue-600 min-w-[200px]"
      />

      {/* This week toggle */}
      <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.interviewsThisWeekOnly}
          onChange={(e) => onChange({ ...filters, interviewsThisWeekOnly: e.target.checked })}
          className="accent-blue-600"
        />
        Interviews this week
      </label>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-stone-500 hover:text-stone-800 underline ml-auto"
        >
          Clear
        </button>
      )}
    </div>
  );
}
