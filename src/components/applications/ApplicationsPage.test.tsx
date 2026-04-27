import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAppStore } from '../../stores/useAppStore';
import type { Application } from '../../types/resume';

vi.mock('../../db/persistence', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../db/persistence');
  return {
    ...actual,
    saveApplication: vi.fn(),
    deleteApplication: vi.fn(),
  };
});

// Kanban pulls in @dnd-kit which wants real pointer events; stub it for these tests.
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => [],
  useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, isDragging: false }),
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
}));

import { ApplicationsPage } from './ApplicationsPage';

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

describe('ApplicationsPage', () => {
  beforeEach(() => {
    useAppStore.setState({
      applications: [],
      jobDescriptions: [],
      resumes: [],
      userId: null,
    } as never);
  });

  afterEach(() => {
    useAppStore.setState({ applications: [] } as never);
  });

  it('empty state shows CTA and clicking it sets wizardStep to content-pool + closes', () => {
    const onClose = vi.fn();
    render(<ApplicationsPage onClose={onClose} />);
    const cta = screen.getByRole('button', { name: /generate your first tailored resume/i });
    fireEvent.click(cta);
    expect(useAppStore.getState().wizardStep).toBe('content-pool');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders stat tiles showing counts for the current applications', () => {
    useAppStore.setState({
      applications: [
        mkApp({ id: 'a1', status: 'applied' }),
        mkApp({ id: 'a2', resumeId: 'res-2', status: 'offer' }),
        mkApp({ id: 'a3', resumeId: 'res-3', status: 'rejected' }),
      ],
    } as never);
    render(<ApplicationsPage onClose={vi.fn()} />);
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/closed/i)).toBeInTheDocument();
    expect(screen.getByText(/response rate/i)).toBeInTheDocument();
    expect(screen.getByText(/offer rate/i)).toBeInTheDocument();
  });

  it('view toggle switches between Table and Kanban bodies', () => {
    useAppStore.setState({
      applications: [mkApp({ id: 'a1', company: 'TableCo' })],
    } as never);
    render(<ApplicationsPage onClose={vi.fn()} />);
    // Table is default — rows visible
    expect(screen.getByRole('table')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /kanban/i }));
    // Table is gone; kanban columns (e.g., Draft header) are shown
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /^table$/i }));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('company search filter narrows the visible table rows', async () => {
    useAppStore.setState({
      applications: [
        mkApp({ id: 'a1', company: 'Alpha' }),
        mkApp({ id: 'a2', resumeId: 'res-2', company: 'Beta' }),
      ],
    } as never);
    vi.useFakeTimers();
    render(<ApplicationsPage onClose={vi.fn()} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    const search = screen.getByPlaceholderText(/search company/i) as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'alp' } });
    // FilterBar debounces at 200ms — advance fake clock then flush React updates.
    act(() => { vi.advanceTimersByTime(250); });
    vi.useRealTimers();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).toBeNull();
  });
});
