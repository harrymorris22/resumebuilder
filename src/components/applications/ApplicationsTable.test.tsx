import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationsTable } from './ApplicationsTable';
import type { Application } from '../../types/resume';

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

describe('ApplicationsTable', () => {
  it('renders rows with company, role, and status', () => {
    const apps = [
      mkApp({ id: 'a1', company: 'Alpha', role: 'Backend' }),
      mkApp({ id: 'a2', resumeId: 'res-2', company: 'Beta', role: 'Frontend' }),
    ];
    render(
      <ApplicationsTable
        apps={apps}
        onRowClick={vi.fn()}
        onStatusChange={vi.fn()}
        onOpenResume={vi.fn()}
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('shows empty-state copy when apps is empty', () => {
    render(
      <ApplicationsTable
        apps={[]}
        onRowClick={vi.fn()}
        onStatusChange={vi.fn()}
        onOpenResume={vi.fn()}
      />,
    );
    expect(screen.getByText(/no applications match/i)).toBeInTheDocument();
  });

  it('cycles sort direction when clicking the same column', () => {
    const apps = [
      mkApp({ id: 'a1', company: 'Alpha' }),
      mkApp({ id: 'a2', resumeId: 'res-2', company: 'Zulu' }),
    ];
    render(
      <ApplicationsTable
        apps={apps}
        onRowClick={vi.fn()}
        onStatusChange={vi.fn()}
        onOpenResume={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /company/i })); // asc
    const rowsAsc = screen.getAllByRole('row').slice(1).map((r) => r.textContent);
    expect(rowsAsc[0]).toContain('Alpha');

    fireEvent.click(screen.getByRole('button', { name: /company/i })); // desc
    const rowsDesc = screen.getAllByRole('row').slice(1).map((r) => r.textContent);
    expect(rowsDesc[0]).toContain('Zulu');
  });

  it('row click fires onRowClick with the app id', () => {
    const onRowClick = vi.fn();
    render(
      <ApplicationsTable
        apps={[mkApp({ id: 'click-me' })]}
        onRowClick={onRowClick}
        onStatusChange={vi.fn()}
        onOpenResume={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('row', { name: /acme/i }));
    expect(onRowClick).toHaveBeenCalledWith('click-me');
  });

  it('status dropdown change calls onStatusChange with new status event', () => {
    const onStatusChange = vi.fn();
    render(
      <ApplicationsTable
        apps={[mkApp({ id: 'app-1', status: 'applied' })]}
        onRowClick={vi.fn()}
        onStatusChange={onStatusChange}
        onOpenResume={vi.fn()}
      />,
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'phone_screen' } });
    expect(onStatusChange).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ status: 'phone_screen' }),
    );
  });

  it('Open resume button calls onOpenResume with resumeId', () => {
    const onOpenResume = vi.fn();
    render(
      <ApplicationsTable
        apps={[mkApp({ id: 'app-1', resumeId: 'res-abc' })]}
        onRowClick={vi.fn()}
        onStatusChange={vi.fn()}
        onOpenResume={onOpenResume}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /open resume/i }));
    expect(onOpenResume).toHaveBeenCalledWith('res-abc');
  });
});
