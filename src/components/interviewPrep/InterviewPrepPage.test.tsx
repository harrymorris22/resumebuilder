import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewPrepPage } from './InterviewPrepPage';
import { useAppStore } from '../../stores/useAppStore';
import { INTERVIEW_PREP_QUESTIONS } from '../../constants/interviewPrepQuestions';

// Mock the orchestrator hook.
const mockGenerateAll = vi.fn();
const mockAbortAll = vi.fn();
let mockOrchestratorState = {
  isGenerating: false,
  progress: { done: 0, total: 0, failed: 0 },
  error: null as string | null,
};

vi.mock('../../hooks/useGenerateAllInterviewAnswers', () => ({
  useGenerateAllInterviewAnswers: () => ({
    generateAll: mockGenerateAll,
    abort: mockAbortAll,
    isGenerating: mockOrchestratorState.isGenerating,
    progress: mockOrchestratorState.progress,
    error: mockOrchestratorState.error,
  }),
}));

// Mock the card so we can count them without rendering the full component.
vi.mock('./InterviewPrepCard', () => ({
  InterviewPrepCard: ({ question }: { question: { id: string; question: string } }) => (
    <div data-testid={`card-${question.id}`}>{question.question}</div>
  ),
}));

function setStore(overrides: Record<string, unknown> = {}) {
  useAppStore.setState({
    contentPool: [
      {
        id: 'cp1',
        item: { type: 'bullet', data: { text: 'x' }, context: {} },
        source: 'user',
        createdAt: '',
        updatedAt: '',
      },
    ],
    interviewPrep: null,
    clearAllInterviewPrepAnswers: vi.fn(),
    ...overrides,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockOrchestratorState = { isGenerating: false, progress: { done: 0, total: 0, failed: 0 }, error: null };
  setStore();
});

describe('InterviewPrepPage', () => {
  it('renders all question cards', () => {
    render(<InterviewPrepPage />);
    for (const q of INTERVIEW_PREP_QUESTIONS) {
      expect(screen.getByTestId(`card-${q.id}`)).toBeInTheDocument();
    }
  });

  it('shows empty-pool banner when contentPool is empty', () => {
    setStore({ contentPool: [] });
    render(<InterviewPrepPage />);
    expect(screen.getByText(/Add entries to your Content Pool first/i)).toBeInTheDocument();
  });

  it('does not show empty-pool banner when contentPool is non-empty', () => {
    render(<InterviewPrepPage />);
    expect(screen.queryByText(/Add entries to your Content Pool first/i)).not.toBeInTheDocument();
  });

  it('Generate All is disabled when contentPool is empty', () => {
    setStore({ contentPool: [] });
    render(<InterviewPrepPage />);
    const btn = screen.getByRole('button', { name: 'Generate All' });
    expect(btn).toBeDisabled();
  });

  it('clicking Generate All invokes orchestrator with force=false', async () => {
    const user = userEvent.setup();
    render(<InterviewPrepPage />);
    await user.click(screen.getByRole('button', { name: 'Generate All' }));
    expect(mockGenerateAll).toHaveBeenCalledWith({ force: false });
  });

  it('shows progress counter while generating', () => {
    mockOrchestratorState = {
      isGenerating: true,
      progress: { done: 3, total: INTERVIEW_PREP_QUESTIONS.length, failed: 0 },
      error: null,
    };
    render(<InterviewPrepPage />);
    expect(
      screen.getByText(new RegExp(`3 / ${INTERVIEW_PREP_QUESTIONS.length} answered`)),
    ).toBeInTheDocument();
  });

  it('shows failed count when progress.failed > 0', () => {
    mockOrchestratorState = {
      isGenerating: true,
      progress: { done: 8, total: INTERVIEW_PREP_QUESTIONS.length, failed: 2 },
      error: null,
    };
    render(<InterviewPrepPage />);
    expect(screen.getByText(/\(2 failed\)/)).toBeInTheDocument();
  });

  it('Cancel button during generation calls abort', async () => {
    mockOrchestratorState = {
      isGenerating: true,
      progress: { done: 1, total: INTERVIEW_PREP_QUESTIONS.length, failed: 0 },
      error: null,
    };
    const user = userEvent.setup();
    render(<InterviewPrepPage />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockAbortAll).toHaveBeenCalledOnce();
  });

  it('shows answered counter based on store state', () => {
    setStore({
      interviewPrep: {
        id: 'default',
        answers: { 'tell-me-about-yourself': ['a'], 'greatest-strength': ['b'] },
        updatedAt: '2024',
      },
    });
    render(<InterviewPrepPage />);
    expect(
      screen.getByText(new RegExp(`2 / ${INTERVIEW_PREP_QUESTIONS.length} answered`)),
    ).toBeInTheDocument();
  });

  it('Copy All copies all answered questions in order', async () => {
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    }
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    setStore({
      interviewPrep: {
        id: 'default',
        answers: {
          'tell-me-about-yourself': ['intro one', 'intro two'],
          'greatest-strength': ['strong'],
        },
        updatedAt: '2024',
      },
    });

    const user = userEvent.setup();
    render(<InterviewPrepPage />);
    await user.click(screen.getByRole('button', { name: 'Copy All' }));
    await screen.findByText('Copied!');

    expect(writeTextSpy).toHaveBeenCalledOnce();
    const text = writeTextSpy.mock.calls[0][0];
    expect(text).toContain('Tell me about yourself.');
    expect(text).toContain('- intro one');
    expect(text).toContain('- intro two');
    expect(text).toContain('What is your greatest strength?');
    expect(text).toContain('- strong');

    writeTextSpy.mockRestore();
  });

  it('Copy All is disabled when no answers', () => {
    render(<InterviewPrepPage />);
    const btn = screen.getByRole('button', { name: 'Copy All' });
    expect(btn).toBeDisabled();
  });

  it('Clear All is hidden when no answers', () => {
    const { unmount } = render(<InterviewPrepPage />);
    expect(screen.queryByRole('button', { name: 'Clear All' })).not.toBeInTheDocument();
    unmount();
  });

  it('Clear All is shown when answers exist', () => {
    setStore({
      interviewPrep: { id: 'default', answers: { 'greatest-strength': ['x'] }, updatedAt: '2024' },
    });
    render(<InterviewPrepPage />);
    expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();
  });

  it('clicking Clear All calls store action', async () => {
    const clearAllInterviewPrepAnswers = vi.fn();
    setStore({
      interviewPrep: { id: 'default', answers: { 'greatest-strength': ['x'] }, updatedAt: '2024' },
      clearAllInterviewPrepAnswers,
    });
    const user = userEvent.setup();
    render(<InterviewPrepPage />);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(clearAllInterviewPrepAnswers).toHaveBeenCalledOnce();
  });

  it('shows error banner when orchestrator error set', () => {
    mockOrchestratorState = {
      isGenerating: false,
      progress: { done: 0, total: 0, failed: 0 },
      error: 'Something broke.',
    };
    render(<InterviewPrepPage />);
    expect(screen.getByText('Something broke.')).toBeInTheDocument();
  });
});
