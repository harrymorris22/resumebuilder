interface StatTileProps {
  label: string;
  value: string | number;
  /** When true, render value with Geist Mono (use for percentages/dates). */
  mono?: boolean;
}

export function StatTile({ label, value, mono }: StatTileProps) {
  return (
    <div className="border border-stone-200 rounded-md p-4 bg-white">
      <div
        className={`text-3xl font-display font-bold text-stone-900 tabular-nums ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-stone-500">
        {label}
      </div>
    </div>
  );
}
