import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

// Mock stores / contexts to keep this test focused on nav behaviour.
vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      setSettingsOpen: vi.fn(),
      wizardStep: 'content-pool',
      resumes: [],
    }),
  ),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, firebaseAvailable: false }),
}));

// Mock drawers to assert open/close state via testid.
vi.mock('../wizard/ResumeLibrary', () => ({
  ResumeLibrary: ({ open }: { open: boolean }) =>
    open ? <div data-testid="resume-library-open" /> : null,
}));
vi.mock('../contentPool/ContentPoolDrawer', () => ({
  ContentPoolDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="pool-drawer-open" /> : null,
}));
vi.mock('../interviewPrep/InterviewPrepDrawer', () => ({
  InterviewPrepDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="prep-drawer-open" /> : null,
}));
vi.mock('../auth/SignInButton', () => ({ SignInButton: () => null }));
vi.mock('../auth/UserMenu', () => ({ UserMenu: () => null }));

// Stub build-time globals
(globalThis as unknown as { __APP_VERSION__: string }).__APP_VERSION__ = 'test';
(globalThis as unknown as { __COMMIT_HASH__: string }).__COMMIT_HASH__ = 'abc';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header — Interview Prep nav', () => {
  it('renders an Interview Prep button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /Interview Prep/i })).toBeInTheDocument();
  });

  it('opens InterviewPrepDrawer when Interview Prep button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    // Drawer is closed initially.
    expect(screen.queryByTestId('prep-drawer-open')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Interview Prep/i }));

    expect(screen.getByTestId('prep-drawer-open')).toBeInTheDocument();
  });

  it('keeps Content Pool and My Resumes buttons alongside Interview Prep', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /Content Pool/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Resumes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Interview Prep/i })).toBeInTheDocument();
  });
});
