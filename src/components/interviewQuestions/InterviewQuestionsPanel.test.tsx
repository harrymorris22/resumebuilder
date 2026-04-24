import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InterviewQuestionsPanel } from './InterviewQuestionsPanel';

let mockState: Record<string, unknown>;

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}));

const mockGenerate = vi.fn();
const mockAbort = vi.fn();

vi.mock('../../hooks/useGenerateInterviewQuestions', () => ({
  useGenerateInterviewQuestions: () => ({
    generate: mockGenerate,
    isGenerating: mockState.hookIsGenerating || false,
    error: mockState.hookError || null,
    abort: mockAbort,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    generatedResumeId: 'r1',
    activeJobDescriptionId: 'jd1',
    jobDescriptions: [
      { id: 'jd1', title: 'SWE', company: 'Acme', rawText: '', keywords: [], createdAt: '' },
    ],
    interviewQuestions: [],
    hookIsGenerating: false,
    hookError: null,
  };
});

describe('InterviewQuestionsPanel', () => {
  it('shows "generate a resume first" when no prerequisites', () => {
    mockState.generatedResumeId = null;
    mockState.activeJobDescriptionId = null;
    render(<InterviewQuestionsPanel />);
    expect(
      screen.getByText(/Generate a resume and select a job description first/),
    ).toBeInTheDocument();
  });

  it('shows Generate Questions button when prerequisites met but no questions yet', () => {
    render(<InterviewQuestionsPanel />);
    expect(screen.getByRole('button', { name: /Generate Questions/i })).toBeInTheDocument();
  });

  it('shows questions when there is a match for (generatedResumeId, activeJobDescriptionId)', () => {
    mockState.interviewQuestions = [
      {
        id: 'iq1',
        resumeId: 'r1',
        jobDescriptionId: 'jd1',
        questions: ['What is your biggest project?', 'How do you handle conflict?'],
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    render(<InterviewQuestionsPanel />);
    expect(screen.getByText('What is your biggest project?')).toBeInTheDocument();
    expect(screen.getByText('How do you handle conflict?')).toBeInTheDocument();
  });

  // This is the specific user-reported flow: resume A → gen Qs → create resume B.
  // When B is the generated resume, the Questions tab must NOT show A's questions.
  // Store-level tests can all pass while a component accidentally reintroduces
  // a resume-agnostic read, so this test pins the render behaviour directly.
  it('does NOT leak questions from another resume that shares the same JD', () => {
    mockState.generatedResumeId = 'r2'; // active resume is now R2
    mockState.interviewQuestions = [
      // Questions exist for R1 + jd1. They must not be shown while R2 is active.
      {
        id: 'iq-r1',
        resumeId: 'r1',
        jobDescriptionId: 'jd1',
        questions: ['This is R1 leaking into R2'],
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    render(<InterviewQuestionsPanel />);

    // R1's question text must not appear.
    expect(screen.queryByText(/This is R1 leaking into R2/)).not.toBeInTheDocument();

    // And the panel should fall through to the "no questions yet" state,
    // offering the Generate button instead.
    expect(screen.getByRole('button', { name: /Generate Questions/i })).toBeInTheDocument();
  });

  it('ignores records with matching JD but missing resumeId (legacy rows)', () => {
    mockState.interviewQuestions = [
      {
        id: 'legacy',
        // resumeId missing — ambiguous, must not be treated as a match.
        jobDescriptionId: 'jd1',
        questions: ['legacy'],
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    render(<InterviewQuestionsPanel />);
    expect(screen.queryByText('legacy')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Questions/i })).toBeInTheDocument();
  });
});
