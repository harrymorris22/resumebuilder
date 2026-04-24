import { useId, useCallback } from 'react';
import type { ApplicationStatus } from '../../types/resume';

const PILL_CLASSES: Record<ApplicationStatus, string> = {
  draft: 'bg-stone-100 text-stone-700',
  applied: 'bg-blue-50 text-blue-700',
  phone_screen: 'bg-amber-50 text-amber-800',
  interview: 'bg-amber-100 text-amber-900',
  final_round: 'bg-amber-200 text-amber-900',
  offer: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-stone-200 text-stone-600',
  ghosted: 'bg-red-50 text-red-800',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  phone_screen: 'Phone screen',
  interview: 'Interview',
  final_round: 'Final round',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  ghosted: 'Ghosted',
};

export const ALL_STATUSES: ApplicationStatus[] = [
  'draft',
  'applied',
  'phone_screen',
  'interview',
  'final_round',
  'offer',
  'rejected',
  'withdrawn',
  'ghosted',
];

interface StatusPillProps {
  status: ApplicationStatus;
  showDropdown?: boolean;
  onChange?: (next: ApplicationStatus) => void;
}

/**
 * Colored status badge. If `showDropdown` is true and `onChange` is provided,
 * wraps the pill in a transparent <select> so clicking the pill exposes a
 * native dropdown to change status.
 */
export function StatusPill({ status, showDropdown, onChange }: StatusPillProps) {
  const id = useId();
  const base =
    'inline-flex items-center text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded uppercase';
  const colorClass = PILL_CLASSES[status];

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as ApplicationStatus;
      if (next !== status && onChange) onChange(next);
    },
    [status, onChange],
  );

  if (showDropdown && onChange) {
    return (
      <label htmlFor={id} className="relative inline-flex cursor-pointer">
        <span className={`${base} ${colorClass}`}>{STATUS_LABELS[status]}</span>
        <select
          id={id}
          aria-label="Change status"
          value={status}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 opacity-0 cursor-pointer"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return <span className={`${base} ${colorClass}`}>{STATUS_LABELS[status]}</span>;
}
