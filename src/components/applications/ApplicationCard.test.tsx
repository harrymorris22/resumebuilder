import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationCard } from './ApplicationCard';
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

describe('ApplicationCard', () => {
  it('renders company and role', () => {
    render(<ApplicationCard app={mkApp({ company: 'Globex', role: 'Engineer' })} />);
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });

  it('shows "today" when updatedAt is very recent', () => {
    // Set updatedAt to just now so daysSince = 0
    const now = new Date().toISOString();
    render(<ApplicationCard app={mkApp({ updatedAt: now })} />);
    expect(screen.getByText('today')).toBeInTheDocument();
  });

  it('shows days count when updatedAt is in the past', () => {
    // 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    render(<ApplicationCard app={mkApp({ updatedAt: threeDaysAgo })} />);
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  it('renders a nextStepDate badge when provided', () => {
    render(<ApplicationCard app={mkApp({ nextStepDate: '2026-06-15T00:00:00.000Z' })} />);
    // formatNextStep renders month + day
    const badge = screen.getByText(/jun/i);
    expect(badge).toBeInTheDocument();
  });

  it('does not render nextStepDate badge when absent', () => {
    const { container } = render(<ApplicationCard app={mkApp({ nextStepDate: undefined })} />);
    // The amber badge element should not exist
    expect(container.querySelector('.bg-amber-50')).toBeNull();
  });

  it('calls onClick when the card button is clicked', () => {
    const onClick = vi.fn();
    render(<ApplicationCard app={mkApp()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies grab cursor class when dragging=true', () => {
    const { container } = render(<ApplicationCard app={mkApp()} dragging />);
    expect(container.querySelector('.cursor-grabbing')).toBeTruthy();
  });

  it('applies pointer cursor class when dragging=false', () => {
    const { container } = render(<ApplicationCard app={mkApp()} dragging={false} />);
    expect(container.querySelector('.cursor-pointer')).toBeTruthy();
  });

  it('formatNextStep falls back to raw string for invalid date', () => {
    render(<ApplicationCard app={mkApp({ nextStepDate: 'not-a-date' })} />);
    // Falls back to the raw string
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });
});
