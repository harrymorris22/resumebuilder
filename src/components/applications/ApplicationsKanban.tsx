import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Application, ApplicationStatus } from '../../types/resume';
import { PIPELINE_STAGES, TERMINAL_STATUSES } from '../../types/resume';
import { ApplicationCard } from './ApplicationCard';
import { STATUS_LABELS } from './StatusPill';
import { generateId } from '../../utils/id';

interface ApplicationsKanbanProps {
  apps: Application[];
  onOpen: (appId: string) => void;
  onStatusChange: (
    appId: string,
    event: { id: string; status: ApplicationStatus; date: string },
  ) => void;
}

function DraggableCard({
  app,
  onOpen,
}: {
  app: Application;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  });
  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : {};
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-2">
      <ApplicationCard app={app} onClick={() => onOpen(app.id)} dragging={isDragging} />
    </div>
  );
}

function Column({
  status,
  apps,
  onOpen,
}: {
  status: ApplicationStatus | 'closed';
  apps: Application[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = status === 'closed' ? 'Closed' : STATUS_LABELS[status];
  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-56 bg-stone-50 border border-stone-200 rounded-md p-2 ${
        isOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-2 border-b border-stone-200 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-stone-600">
          {label}
        </span>
        <span className="font-mono text-xs text-stone-500 tabular-nums">{apps.length}</span>
      </div>
      <div className="min-h-[40px]">
        {apps.map((app) => (
          <DraggableCard key={app.id} app={app} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export function ApplicationsKanban({
  apps,
  onOpen,
  onStatusChange,
}: ApplicationsKanbanProps) {
  const [closedExpanded, setClosedExpanded] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus: Record<string, Application[]> = {};
  for (const stage of PIPELINE_STAGES) byStatus[stage] = [];
  byStatus.closed = [];
  for (const app of apps) {
    if (TERMINAL_STATUSES.includes(app.status)) byStatus.closed.push(app);
    else byStatus[app.status]?.push(app);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const appId = String(active.id);
    const destCol = String(over.id);
    const app = apps.find((a) => a.id === appId);
    if (!app) return;

    // Dropping into "closed" collapses to rejected by default — otherwise
    // we'd have to pick between rejected/withdrawn/ghosted arbitrarily.
    // User can refine via detail drawer.
    // Exception: block offer→Closed drag to prevent accidental demotion of a
    // hard-won offer. The user should set terminal status explicitly via the
    // detail drawer if an offer falls through.
    if (destCol === 'closed' && app.status === 'offer') return;

    const nextStatus: ApplicationStatus =
      destCol === 'closed' ? 'rejected' : (destCol as ApplicationStatus);

    // No-op on same-column drop.
    if (nextStatus === app.status) return;

    onStatusChange(appId, {
      id: generateId(),
      status: nextStatus,
      date: new Date().toISOString(),
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage) => (
          <Column key={stage} status={stage} apps={byStatus[stage] ?? []} onOpen={onOpen} />
        ))}

        {/* Closed column (collapsed by default). Toggle button lives in the
            header. Still a drop target — dropping here moves to 'rejected'. */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => setClosedExpanded((e) => !e)}
            className="w-full text-left text-[11px] font-medium uppercase tracking-wider text-stone-500 hover:text-stone-800 mb-1"
          >
            {closedExpanded ? '▼' : '▶'} Closed ({byStatus.closed.length})
          </button>
          {closedExpanded ? (
            <Column status="closed" apps={byStatus.closed} onOpen={onOpen} />
          ) : (
            <Column status="closed" apps={[]} onOpen={onOpen} />
          )}
        </div>
      </div>
    </DndContext>
  );
}
