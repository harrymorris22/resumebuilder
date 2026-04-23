import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewPrepDrawer } from './InterviewPrepDrawer';

vi.mock('./InterviewPrepPage', () => ({
  InterviewPrepPage: () => <div data-testid="interview-prep-page">InterviewPrepPage</div>,
}));

describe('InterviewPrepDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<InterviewPrepDrawer open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders InterviewPrepPage when open', () => {
    render(<InterviewPrepDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Interview Prep')).toBeInTheDocument();
    expect(screen.getByTestId('interview-prep-page')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<InterviewPrepDrawer open={true} onClose={onClose} />);
    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<InterviewPrepDrawer open={true} onClose={onClose} />);
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/20');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });
});
