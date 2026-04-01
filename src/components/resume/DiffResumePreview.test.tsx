import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffResumePreview } from './DiffResumePreview';
import type { ResumeSection } from '../../types/resume';

let mockState: Record<string, unknown>;

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}));

vi.mock('./DiffText', () => ({
  DiffText: ({ oldText, newText }: { oldText: string; newText: string }) => (
    <span data-testid="diff-text" data-old={oldText} data-new={newText}>
      {oldText !== newText ? `${oldText} → ${newText}` : oldText}
    </span>
  ),
}));

const makeSections = (overrides: Partial<ResumeSection>[] = []): ResumeSection[] => {
  const defaults: ResumeSection[] = [
    { id: 'contact', order: 0, visible: true, content: { type: 'contact', data: { fullName: 'John', email: 'j@e.com', phone: '555', location: 'NYC' } } },
    { id: 'summary', order: 1, visible: true, content: { type: 'summary', data: { text: 'Original summary text' } } },
    { id: 'exp', order: 2, visible: true, content: { type: 'experience', data: { items: [{ id: 'e1', company: 'Acme', title: 'SWE', location: 'NYC', dateRange: { start: '2020', end: null }, bullets: ['Built REST API', 'Led team of 5'] }] } } },
  ];
  return defaults.map((d, i) => overrides[i] ? { ...d, ...overrides[i] } : d);
};

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    resumes: [{ id: 'r1', name: 'Test', sections: makeSections([
      undefined,
      { id: 'summary', order: 1, visible: true, content: { type: 'summary', data: { text: 'Improved summary text' } } },
      { id: 'exp', order: 2, visible: true, content: { type: 'experience', data: { items: [{ id: 'e1', company: 'Acme', title: 'SWE', location: 'NYC', dateRange: { start: '2020', end: null }, bullets: ['Built GraphQL API', 'Led cross-functional team of 5'] }] } } },
    ]) }],
    activeResumeId: 'r1',
  };
});

describe('DiffResumePreview', () => {
  it('renders nothing when no active resume', () => {
    mockState.activeResumeId = null;
    const { container } = render(<DiffResumePreview snapshot={makeSections()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders change legend', () => {
    render(<DiffResumePreview snapshot={makeSections()} />);
    expect(screen.getByText('Changes:')).toBeInTheDocument();
    expect(screen.getByText('removed')).toBeInTheDocument();
    expect(screen.getByText('added')).toBeInTheDocument();
  });

  it('renders summary diff', () => {
    render(<DiffResumePreview snapshot={makeSections()} />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    const summaryDiff = screen.getAllByTestId('diff-text').find(
      (el) => el.getAttribute('data-old') === 'Original summary text'
    );
    expect(summaryDiff).toBeInTheDocument();
    expect(summaryDiff?.getAttribute('data-new')).toBe('Improved summary text');
  });

  it('renders experience bullet diffs', () => {
    render(<DiffResumePreview snapshot={makeSections()} />);
    expect(screen.getByText('Experience')).toBeInTheDocument();
    const bulletDiff = screen.getAllByTestId('diff-text').find(
      (el) => el.getAttribute('data-old') === 'Built REST API'
    );
    expect(bulletDiff).toBeInTheDocument();
    expect(bulletDiff?.getAttribute('data-new')).toBe('Built GraphQL API');
  });

  it('renders contact section without diff', () => {
    render(<DiffResumePreview snapshot={makeSections()} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
