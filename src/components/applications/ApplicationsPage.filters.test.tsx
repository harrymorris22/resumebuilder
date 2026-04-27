/**
 * Focused tests for ApplicationsPage filter paths:
 * - status filter
 * - interviewsThisWeekOnly filter
 * - role search
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
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
    id: `app-${Math.random()}`,
    resumeId: `res-${Math.random()}`,
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

describe('ApplicationsPage — filter paths', () => {
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

  it('filtering by status hides rows that do not match', () => {
    useAppStore.setState({
      applications: [
        mkApp({ id: 'a1', company: 'AlphaCo', status: 'applied' }),
        mkApp({ id: 'a2', company: 'BetaCo', status: 'interview' }),
      ],
    } as never);
    render(<ApplicationsPage onClose={vi.fn()} />);

    // Open status popover — there's exactly one "Status" button in the FilterBar
    const statusBtn = screen.getAllByRole('button', { name: /^status$/i })[0];
    fireEvent.click(statusBtn);

    // checkboxes in popover: ALL_STATUSES order = draft(0), applied(1), phone_screen(2)...
    // "Interviews this week" checkbox comes after the popover in DOM.
    const checkboxes = screen.getAllByRole('checkbox');
    // applied = ALL_STATUSES[1] = checkboxes[1]
    fireEvent.click(checkboxes[1]); // applied

    // Only AlphaCo (applied) should be visible in the table
    expect(screen.getByText('AlphaCo')).toBeInTheDocument();
    expect(screen.queryByText('BetaCo')).toBeNull();
  });

  it('interviewsThisWeekOnly checkbox hides apps without a relevant nextStepDate', () => {
    const inWindow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    useAppStore.setState({
      applications: [
        mkApp({ id: 'a1', company: 'InWindowCo', status: 'interview', nextStepDate: inWindow }),
        mkApp({ id: 'a2', company: 'NoDateCo', status: 'applied', nextStepDate: null }),
      ],
    } as never);
    render(<ApplicationsPage onClose={vi.fn()} />);

    const checkbox = screen.getByLabelText(/interviews this week/i);
    fireEvent.click(checkbox);

    expect(screen.getByText('InWindowCo')).toBeInTheDocument();
    expect(screen.queryByText('NoDateCo')).toBeNull();
  });

  it('role search matches against role field', () => {
    useAppStore.setState({
      applications: [
        mkApp({ id: 'a1', company: 'Corp', role: 'Backend Engineer' }),
        mkApp({ id: 'a2', company: 'Corp2', role: 'Designer' }),
      ],
    } as never);
    vi.useFakeTimers();
    render(<ApplicationsPage onClose={vi.fn()} />);

    const search = screen.getByPlaceholderText(/search company/i);
    fireEvent.change(search, { target: { value: 'backend' } });
    act(() => { vi.advanceTimersByTime(250); });
    vi.useRealTimers();

    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Designer')).toBeNull();
  });

  it('handleOpenResume falls back to setActiveResumeId + onClose when no onOpenResume prop', () => {
    useAppStore.setState({
      applications: [mkApp({ id: 'a1', resumeId: 'res-fallback', status: 'applied' })],
    } as never);
    const onClose = vi.fn();
    render(<ApplicationsPage onClose={onClose} />);

    // Click the "Open resume" button in the table
    fireEvent.click(screen.getByRole('button', { name: /open resume/i }));

    expect(useAppStore.getState().activeResumeId).toBe('res-fallback');
    expect(useAppStore.getState().wizardStep).toBe('refine');
    expect(onClose).toHaveBeenCalled();
  });

  it('handleOpenResume calls onOpenResume prop when provided', () => {
    useAppStore.setState({
      applications: [mkApp({ id: 'a1', resumeId: 'res-custom', status: 'applied' })],
    } as never);
    const onOpenResume = vi.fn();
    render(<ApplicationsPage onClose={vi.fn()} onOpenResume={onOpenResume} />);

    fireEvent.click(screen.getByRole('button', { name: /open resume/i }));

    expect(onOpenResume).toHaveBeenCalledWith('res-custom');
  });
});
