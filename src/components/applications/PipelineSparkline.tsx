import { PIPELINE_STAGES } from '../../types/resume';
import { STATUS_LABELS } from './StatusPill';

interface PipelineSparklineProps {
  counts: number[]; // [draft, applied, phone_screen, interview, final_round, offer]
}

/**
 * 6-bar inline SVG sparkline. Heights normalized to max count in the series.
 * No chart library, ~40 lines, zero deps. Consistent with DESIGN.md minimal.
 */
export function PipelineSparkline({ counts }: PipelineSparklineProps) {
  const maxCount = Math.max(1, ...counts);
  const barWidth = 14;
  const gap = 4;
  const maxHeight = 48;
  const total = counts.length;
  const width = total * barWidth + (total - 1) * gap;

  return (
    <div className="border border-stone-200 rounded-md p-4 bg-white">
      <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500 mb-2">
        Pipeline
      </div>
      <div className="flex items-end gap-1">
        <svg
          width={width}
          height={maxHeight}
          viewBox={`0 0 ${width} ${maxHeight}`}
          role="img"
          aria-label="Applications by pipeline stage"
        >
          {counts.map((count, i) => {
            const h = Math.max(2, (count / maxCount) * maxHeight);
            const x = i * (barWidth + gap);
            const y = maxHeight - h;
            const stage = PIPELINE_STAGES[i];
            return (
              <g key={stage}>
                <title>{`${STATUS_LABELS[stage]}: ${count}`}</title>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={1}
                  className={count > 0 ? 'fill-blue-600' : 'fill-stone-200'}
                />
              </g>
            );
          })}
        </svg>
        <div className="ml-2 font-mono text-xs text-stone-500 tabular-nums self-end">
          {counts.join(' · ')}
        </div>
      </div>
    </div>
  );
}
