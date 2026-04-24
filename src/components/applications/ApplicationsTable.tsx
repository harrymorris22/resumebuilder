import { useState, useMemo } from 'react';
import type { Application, ApplicationStatus } from '../../types/resume';
import { StatusPill } from './StatusPill';
import { daysSince } from '../../utils/applicationStats';
import { generateId } from '../../utils/id';

type SortKey = 'company' | 'role' | 'status' | 'appliedAt' | 'nextStepDate' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface ApplicationsTableProps {
  apps: Application[];
  onRowClick: (appId: string) => void;
  onStatusChange: (
    appId: string,
    event: { id: string; status: ApplicationStatus; date: string },
  ) => void;
  onOpenResume: (resumeId: string) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function compare(a: Application, b: Application, key: SortKey): number {
  switch (key) {
    case 'company':
      return a.company.localeCompare(b.company);
    case 'role':
      return a.role.localeCompare(b.role);
    case 'status':
      return a.status.localeCompare(b.status);
    case 'appliedAt':
      return (a.appliedAt ?? '').localeCompare(b.appliedAt ?? '');
    case 'nextStepDate':
      return (a.nextStepDate ?? '').localeCompare(b.nextStepDate ?? '');
    case 'updatedAt':
      return a.updatedAt.localeCompare(b.updatedAt);
  }
}

export function ApplicationsTable({
  apps,
  onRowClick,
  onStatusChange,
  onOpenResume,
}: ApplicationsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const arr = [...apps];
    arr.sort((a, b) => {
      const cmp = compare(a, b, sortKey);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [apps, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortButton({ k, children }: { k: SortKey; children: React.ReactNode }) {
    const active = sortKey === k;
    return (
      <button
        type="button"
        onClick={() => handleSort(k)}
        className={`flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider ${
          active ? 'text-stone-900' : 'text-stone-500'
        } hover:text-stone-800`}
      >
        {children}
        {active && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-sm text-stone-500 py-8 text-center border border-dashed border-stone-200 rounded-md">
        No applications match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-stone-200 rounded-md bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            <th className="px-3 py-2 text-left"><SortButton k="company">Company</SortButton></th>
            <th className="px-3 py-2 text-left"><SortButton k="role">Role</SortButton></th>
            <th className="px-3 py-2 text-left"><SortButton k="status">Status</SortButton></th>
            <th className="px-3 py-2 text-left"><SortButton k="appliedAt">Applied</SortButton></th>
            <th className="px-3 py-2 text-left"><SortButton k="nextStepDate">Next step</SortButton></th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-stone-500">Age</th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-stone-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => (
            <tr
              key={app.id}
              onClick={() => onRowClick(app.id)}
              className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
            >
              <td className="px-3 py-2 font-medium text-stone-900">{app.company}</td>
              <td className="px-3 py-2 text-stone-700">{app.role}</td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <StatusPill
                  status={app.status}
                  showDropdown
                  onChange={(next) =>
                    onStatusChange(app.id, {
                      id: generateId(),
                      status: next,
                      date: new Date().toISOString(),
                    })
                  }
                />
              </td>
              <td className="px-3 py-2 font-mono text-xs text-stone-600 tabular-nums">
                {formatDate(app.appliedAt)}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-stone-600 tabular-nums">
                {formatDate(app.nextStepDate)}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-stone-500 tabular-nums">
                {daysSince(app.updatedAt)}d
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onOpenResume(app.resumeId)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Open resume
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
