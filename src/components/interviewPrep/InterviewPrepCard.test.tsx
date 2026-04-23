import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewPrepCard } from './InterviewPrepCard';
import type { InterviewPrepQuestion } from '../../constants/interviewPrepQuestions';
import { useAppStore } from '../../stores/useAppStore';

// Mock the generation hook — we test its interaction, not its internals.
const mockGenerate = vi.fn();
const mockAbort = vi.fn();
let mockIsGenerating = false;
let mockError: string | null = null;

vi.mock('../../hooks/useGenerateInterviewAnswer', () => ({
  useGenerateInterviewAnswer: () => ({
    generate: mockGenerate,
    isGenerating: mockIsGenerating,
    error: mockError,
    abort: mockAbort,
  }),
}));

const question: InterviewPrepQuestion = {
  id: 'greatest-strength',
  question: 'What is your greatest strength?',
  category: 'strengths-weaknesses',
};

function setStore(answers: Record<string, string[]> = {}) {
  useAppStore.setState({
    interviewPrep: { id: 'default', answers, updatedAt: '2024' },
    clearInterviewPrepAnswer: vi.fn(),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsGenerating = false;
  mockError = null;
  setStore({});
});

describe('InterviewPrepCard', () => {
  it('renders the question and category pill', () => {
    render(<InterviewPrepCard question={question} />);
    expect(screen.getByText('What is your greatest strength?')).toBeInTheDocument();
    expect(screen.getByText('Strengths / Weaknesses')).toBeInTheDocument();
  });

  it('shows Generate Answer button when no answer exists', () => {
    render(<InterviewPrepCard question={question} />);
    expect(screen.getByRole('button', { name: 'Generate Answer' })).toBeInTheDocument();
  });

  it('calls generate() when Generate Answer clicked', async () => {
    const user = userEvent.setup();
    render(<InterviewPrepCard question={question} />);
    await user.click(screen.getByRole('button', { name: 'Generate Answer' }));
    expect(mockGenerate).toHaveBeenCalledOnce();
  });

  it('shows spinner + Cancel while generating', () => {
    mockIsGenerating = true;
    render(<InterviewPrepCard question={question} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls abort() when Cancel clicked', async () => {
    mockIsGenerating = true;
    const user = userEvent.setup();
    render(<InterviewPrepCard question={question} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockAbort).toHaveBeenCalledOnce();
  });

  it('shows error banner when error is set', () => {
    mockError = 'Something went wrong';
    render(<InterviewPrepCard question={question} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders bullets when answer exists', () => {
    setStore({ 'greatest-strength': ['First bullet', 'Second bullet', 'Third bullet'] });
    render(<InterviewPrepCard question={question} />);
    expect(screen.getByText('First bullet')).toBeInTheDocument();
    expect(screen.getByText('Second bullet')).toBeInTheDocument();
    expect(screen.getByText('Third bullet')).toBeInTheDocument();
  });

  it('shows Copy, Regenerate, Clear buttons when bullets exist', () => {
    setStore({ 'greatest-strength': ['a bullet'] });
    render(<InterviewPrepCard question={question} />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('copies formatted question + bullets to clipboard', async () => {
    // jsdom may provide a clipboard stub; either way spy the method in-place.
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    }
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    setStore({ 'greatest-strength': ['bullet 1', 'bullet 2'] });

    const user = userEvent.setup();
    render(<InterviewPrepCard question={question} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await screen.findByText('Copied!');

    expect(writeTextSpy).toHaveBeenCalledWith(
      'What is your greatest strength?\n\n- bullet 1\n- bullet 2',
    );

    writeTextSpy.mockRestore();
  });

  it('calls generate() again when Regenerate clicked', async () => {
    setStore({ 'greatest-strength': ['existing bullet'] });
    const user = userEvent.setup();
    render(<InterviewPrepCard question={question} />);
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(mockGenerate).toHaveBeenCalledOnce();
  });

  it('calls clearInterviewPrepAnswer when Clear clicked', async () => {
    const clearInterviewPrepAnswer = vi.fn();
    useAppStore.setState({
      interviewPrep: { id: 'default', answers: { 'greatest-strength': ['x'] }, updatedAt: '2024' },
      clearInterviewPrepAnswer,
    } as never);

    const user = userEvent.setup();
    render(<InterviewPrepCard question={question} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(clearInterviewPrepAnswer).toHaveBeenCalledWith('greatest-strength');
  });

  it('does not show Generate Answer button when isGenerating', () => {
    mockIsGenerating = true;
    render(<InterviewPrepCard question={question} />);
    expect(screen.queryByRole('button', { name: 'Generate Answer' })).not.toBeInTheDocument();
  });
});
