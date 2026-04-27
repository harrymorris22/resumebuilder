import type { Application } from '../../types/resume';
import { daysSince } from '../../utils/applicationStats';

interface ApplicationCardProps {
  app: Application;
  onClick?: () => void;
  /** When true, render with grab cursor and slight shadow for drag feedback. */
  dragging?: boolean;
}

function formatNextStep(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ApplicationCard({ app, onClick, dragging }: ApplicationCardProps) {
  const days = daysSince(app.updatedAt);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border border-stone-200 rounded-md p-3 bg-white hover:border-stone-300 transition-colors ${
        dragging ? 'cursor-grabbing shadow-md' : 'cursor-pointer'
      }`}
    >
      <div className="font-display font-bold text-sm text-stone-900 truncate">
        {app.company}
      </div>
      <div className="text-xs text-stone-600 truncate mt-0.5">{app.role}</div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-stone-500 tabular-nums">
        <span>{days === 0 ? 'today' : `${days}d ago`}</span>
        {app.nextStepDate && (
          <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
            {formatNextStep(app.nextStepDate)}
          </span>
        )}
      </div>
    </button>
  );
}
