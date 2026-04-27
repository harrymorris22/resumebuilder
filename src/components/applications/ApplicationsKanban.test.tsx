import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Application } from '../../types/resume';

// Capture the onDragEnd callback from DndContext so the test can invoke it.
let capturedOnDragEnd: ((e: { active: { id: string }; over: { id: string } | null }) => void) | null = null;

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (e: unknown) => void }) => {
    capturedOnDragEnd = onDragEnd as typeof capturedOnDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => [],
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
}));

// Import after mock so the mock is in effect.
import { ApplicationsKanban } from './ApplicationsKanban';

function mkApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    resumeId: 'res-1',
    jobDescriptionId: 'jd-1',
    company: 'Acme',
    role: 'SWE',
    status: 'draft',
    appliedAt: null,
    events: [{ id: 'ev-0', status: 'draft', date: '2026-04-01T00:00:00.000Z' }],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ApplicationsKanban', () => {
  beforeEach(() => {
    capturedOnDragEnd = null;
  });

  it('renders the 6 pipeline columns plus a Closed toggle', () => {
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'a1', status: 'draft' })]}
        onOpen={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    // Column headers for the pipeline stages
    expect(screen.getByText(/^draft$/i)).toBeInTheDocument();
    expect(screen.getByText(/^applied$/i)).toBeInTheDocument();
    expect(screen.getByText(/phone screen/i)).toBeInTheDocument();
    expect(screen.getByText(/^interview$/i)).toBeInTheDocument();
    expect(screen.getByText(/final round/i)).toBeInTheDocument();
    expect(screen.getByText(/^offer$/i)).toBeInTheDocument();
    // Closed toggle button
    expect(screen.getByRole('button', { name: /closed/i })).toBeInTheDocument();
  });

  it('hides terminal applications until Closed is expanded', () => {
    render(
      <ApplicationsKanban
        apps={[
          mkApp({ id: 'a1', company: 'ActiveCo', status: 'applied' }),
          mkApp({ id: 'a2', company: 'DeadCo', status: 'rejected' }),
        ]}
        onOpen={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    // Active application visible immediately
    expect(screen.getByText('ActiveCo')).toBeInTheDocument();
    // Terminal application hidden until expand
    expect(screen.queryByText('DeadCo')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /closed \(1\)/i }));
    expect(screen.getByText('DeadCo')).toBeInTheDocument();
  });

  it('drag end into a different column calls onStatusChange with new status', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'app-1', status: 'draft' })]}
        onOpen={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );
    expect(capturedOnDragEnd).not.toBeNull();
    capturedOnDragEnd!({ active: { id: 'app-1' }, over: { id: 'applied' } });
    expect(onStatusChange).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ status: 'applied' }),
    );
  });

  it('drag end into the same column is a no-op', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'app-1', status: 'applied' })]}
        onOpen={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );
    capturedOnDragEnd!({ active: { id: 'app-1' }, over: { id: 'applied' } });
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('drag end onto Closed column maps to rejected', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'app-1', status: 'interview' })]}
        onOpen={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );
    capturedOnDragEnd!({ active: { id: 'app-1' }, over: { id: 'closed' } });
    expect(onStatusChange).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ status: 'rejected' }),
    );
  });

  it('drag end with no drop target does nothing', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'app-1', status: 'draft' })]}
        onOpen={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );
    capturedOnDragEnd!({ active: { id: 'app-1' }, over: null });
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('drag offer app into Closed column is blocked (offer-protection guard)', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'app-offer', status: 'offer' })]}
        onOpen={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );
    capturedOnDragEnd!({ active: { id: 'app-offer' }, over: { id: 'closed' } });
    // offer → closed drag must be silently blocked
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('drag with unknown app id does nothing', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsKanban
        apps={[mkApp({ id: 'app-1', status: 'draft' })]}
        onOpen={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );
    capturedOnDragEnd!({ active: { id: 'nonexistent' }, over: { id: 'applied' } });
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
