/**
 * Additional coverage for ApplicationDetailDrawer paths not covered by the
 * primary test file: MetaField save-on-blur, notes save-on-blur, role edit,
 * View JD button, Log event cancel button, and backdrop click.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    rawText: 'job description',
    keywords: [],
    createdAt: '2026-04-01T00:00:00.000Z',
  };
}

function seedStore(app: Application, jds: JobDescription[] = [mkJd()]) {
  useAppStore.setState({ applications: [app], jobDescriptions: jds, userId: null } as never);
}

describe('ApplicationDetailDrawer — extra coverage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => {
    useAppStore.setState({ applications: [], jobDescriptions: [] } as never);
    vi.restoreAllMocks();
  });

  it('inline-edits role and calls updateApplication on blur', () => {
    seedStore(mkApp());
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    const roleInput = screen.getByLabelText('Role') as HTMLInputElement;
    fireEvent.change(roleInput, { target: { value: 'Staff Engineer' } });
    fireEvent.blur(roleInput);
    expect(useAppStore.getState().applications[0].role).toBe('Staff Engineer');
  });

  it('does not call updateApplication when role value is unchanged on blur', () => {
    seedStore(mkApp({ role: 'SWE' }));
    const spy = vi.spyOn(useAppStore.getState(), 'updateApplication');
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    const roleInput = screen.getByLabelText('Role') as HTMLInputElement;
    // blur without changing value
    fireEvent.blur(roleInput);
    expect(spy).not.toHaveBeenCalled();
  });

  it('notes textarea saves on blur when changed', () => {
    seedStore(mkApp({ notes: '' }));
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    // The notes textarea has no accessible label — find via DOM query
    const notesArea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(notesArea, { target: { value: 'Great culture fit' } });
    fireEvent.blur(notesArea);
    expect(useAppStore.getState().applications[0].notes).toBe('Great culture fit');
  });

  it('View JD button sets active job description id', () => {
    const jd = mkJd('jd-1');
    seedStore(mkApp({ jobDescriptionId: 'jd-1' }), [jd]);
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    const viewJdBtn = screen.getByRole('button', { name: /view jd/i });
    fireEvent.click(viewJdBtn);
    expect(useAppStore.getState().activeJobDescriptionId).toBe('jd-1');
  });

  it('Log event cancel button hides the form', () => {
    seedStore(mkApp({ status: 'applied' }));
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    // Open the form
    fireEvent.click(screen.getByRole('button', { name: /log event/i }));
    expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
    // Cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /add event/i })).toBeNull();
  });

  it('Open resume button calls onOpenResume with app resumeId', () => {
    seedStore(mkApp({ resumeId: 'res-xyz' }));
    const onOpenResume = vi.fn();
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={onOpenResume} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /open resume/i }));
    expect(onOpenResume).toHaveBeenCalledWith('res-xyz');
  });

  it('backdrop click fires onClose', () => {
    seedStore(mkApp());
    const onClose = vi.fn();
    const { container } = render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={onClose} onOpenResume={vi.fn()} />,
    );
    // The backdrop is the first fixed inset-0 div
    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/10') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('MetaField saves jobUrl on blur', () => {
    seedStore(mkApp({ jobUrl: '' }));
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    // Job URL input — MetaField renders a label + input; find by label text
    const jobUrlInput = screen.getByLabelText(/job url/i) as HTMLInputElement;
    fireEvent.change(jobUrlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(jobUrlInput);
    expect(useAppStore.getState().applications[0].jobUrl).toBe('https://example.com');
  });

  it('MetaField saves null when field is cleared (empty string becomes undefined)', () => {
    seedStore(mkApp({ salary: '$100k' }));
    render(
      <ApplicationDetailDrawer applicationId="app-1" onClose={vi.fn()} onOpenResume={vi.fn()} />,
    );
    const salaryInput = screen.getByLabelText(/salary/i) as HTMLInputElement;
    fireEvent.change(salaryInput, { target: { value: '' } });
    fireEvent.blur(salaryInput);
    // Empty string → undefined (falsy check in onSave)
    expect(useAppStore.getState().applications[0].salary).toBeUndefined();
  });
});
