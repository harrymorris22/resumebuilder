import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusPill, STATUS_LABELS, ALL_STATUSES } from './StatusPill';

describe('StatusPill', () => {
  it('renders every status with its label', () => {
    for (const s of ALL_STATUSES) {
      const { unmount } = render(<StatusPill status={s} />);
      expect(screen.getByText(STATUS_LABELS[s])).toBeInTheDocument();
      unmount();
    }
  });

  it('applies distinct color classes per status', () => {
    const { container: draft } = render(<StatusPill status="draft" />);
    const { container: offer } = render(<StatusPill status="offer" />);
    const { container: rejected } = render(<StatusPill status="rejected" />);
    expect(draft.querySelector('.bg-stone-100')).toBeTruthy();
    expect(offer.querySelector('.bg-emerald-50')).toBeTruthy();
    expect(rejected.querySelector('.bg-red-50')).toBeTruthy();
  });

  it('shows no dropdown when showDropdown is false', () => {
    render(<StatusPill status="applied" />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders a dropdown and fires onChange with new status', () => {
    const onChange = vi.fn();
    render(<StatusPill status="applied" showDropdown onChange={onChange} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'phone_screen' } });
    expect(onChange).toHaveBeenCalledWith('phone_screen');
  });

  it('does not fire onChange when selecting the same status', () => {
    const onChange = vi.fn();
    render(<StatusPill status="applied" showDropdown onChange={onChange} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'applied' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not render dropdown if showDropdown without onChange', () => {
    render(<StatusPill status="applied" showDropdown />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
