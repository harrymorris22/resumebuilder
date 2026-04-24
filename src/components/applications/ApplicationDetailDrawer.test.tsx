import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAppStore } from '../../stores/useAppStore';
import type { Application, JobDescription } from '../../types/resume';

vi.mock('../../db/persistence', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../db/persistence');
  return {
    ...actual,
    saveApplication: vi.fn(),
    deleteApplication: vi.fn(),
    saveJobDescription: vi.fn(),
    deleteJobDescription: vi.fn(),
    saveResume: vi.fn(),
    deleteResume: vi.fn(),
  };
});

import { ApplicationDetailDrawer } from './ApplicationDetailDrawer';

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

function mkJd(id = 'jd-1'): JobDescription {
  return {
    id,
    title: 'SWE',
    company: 'Acme',
    fullText: 'job description',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  };
}

function seedStore(app: Application, jds: JobDescription[] = [mkJd()]) {
  useAppStore.setState({
    applications: [app],
    jobDescriptions: jds,
    userId: null,
  } as never);
}

describe('ApplicationDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    useAppStore.setState({ applications: [], jobDescriptions: [] } as never);
    vi.restoreAllMocks();
  });

  it('renders nothing when applicationId is null', () => {
    seedStore(mkApp());
    const { container } = render(
      <ApplicationDetailDrawer applicationId={null} onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('inline-edits company and calls updateApplication on blur', () => {
    seedStore(mkApp());
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    const companyInput = screen.getByLabelText('Company') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'NewCo' } });
    fireEvent.blur(companyInput);
    expect(useAppStore.getState().applications[0].company).toBe('NewCo');
  });

  it('Mark applied creates an applied event and the button is no longer available (prevents double-fire)', () => {
    seedStore(mkApp({ status: 'draft' }));
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /mark applied/i }));
    const app = useAppStore.getState().applications[0];
    expect(app.status).toBe('applied');
    expect(app.events[app.events.length - 1].status).toBe('applied');
    // Button disappears after status moves off draft — a second click can't happen.
    expect(screen.queryByRole('button', { name: /mark applied/i })).toBeNull();
    // Exactly one event was appended.
    expect(app.events).toHaveLength(2);
  });

  it('shows "JD deleted" when the linked JD is missing from the store', () => {
    seedStore(mkApp({ jobDescriptionId: 'missing-jd' }), []);
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    expect(screen.getByText(/jd deleted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view jd/i })).toBeNull();
  });

  it('Log event form adds a new event with the note', () => {
    seedStore(mkApp({ status: 'applied', events: [{ id: 'ev-0', status: 'applied', date: '2026-04-01T00:00:00.000Z' }] }));
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /log event/i }));
    const select = screen.getByLabelText(/status/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'phone_screen' } });
    const noteInput = screen.getByLabelText(/note/i) as HTMLInputElement;
    fireEvent.change(noteInput, { target: { value: 'Recruiter reached out' } });
    fireEvent.click(screen.getByRole('button', { name: /add event/i }));
    const app = useAppStore.getState().applications[0];
    expect(app.status).toBe('phone_screen');
    const latest = app.events[app.events.length - 1];
    expect(latest.status).toBe('phone_screen');
    expect(latest.note).toBe('Recruiter reached out');
  });

  it('auto-closes when the application disappears from the store (cascade delete)', () => {
    seedStore(mkApp());
    const onClose = vi.fn();
    const { rerender } = render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={onClose} onOpenResume={vi.fn()} />,
    );
    // Remove the app (simulate cascade)
    act(() => {
      useAppStore.setState({ applications: [] } as never);
    });
    rerender(
      <ApplicationDetailDrawer applicationId="app-1" onClose={onClose} onOpenResume={vi.fn()} />,
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('Delete button calls removeApplication after confirm', () => {
    seedStore(mkApp());
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={onClose} onOpenResume={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete application/i }));
    expect(useAppStore.getState().applications).toHaveLength(0);
    expect(onClose).toHaveBeenCalled();
  });

  it('Delete does nothing when user cancels confirm', () => {
    seedStore(mkApp());
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete application/i }));
    expect(useAppStore.getState().applications).toHaveLength(1);
  });
});
