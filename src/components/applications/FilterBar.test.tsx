import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, EMPTY_FILTERS } from './FilterBar';
import type { Filters } from './FilterBar';

function baseFilters(overrides: Partial<Filters> = {}): Filters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe('FilterBar', () => {
  it('renders Status button, company search input, and Interviews this week checkbox', () => {
    render(<FilterBar filters={baseFilters()} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interviews this week/i)).toBeInTheDocument();
  });

  it('does not show Clear button when no filters are active', () => {
    render(<FilterBar filters={baseFilters()} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('shows Clear button when a status filter is active', () => {
    render(
      <FilterBar
        filters={baseFilters({ statuses: ['applied'] })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('shows Clear button when interviewsThisWeekOnly is active', () => {
    render(
      <FilterBar
        filters={baseFilters({ interviewsThisWeekOnly: true })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('clicking Clear fires onChange with EMPTY_FILTERS and resets local query', () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={baseFilters({ statuses: ['applied'], companyQuery: 'Acme' })}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
    // Local query input should be reset to empty
    const input = screen.getByPlaceholderText(/search company/i) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('toggles interviewsThisWeekOnly when checkbox is clicked', () => {
    const onChange = vi.fn();
    render(
      <FilterBar filters={baseFilters({ interviewsThisWeekOnly: false })} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText(/interviews this week/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ interviewsThisWeekOnly: true }),
    );
  });

  it('Status button opens a popover with all status options', () => {
    render(<FilterBar filters={baseFilters()} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /status/i }));
    // The popover appears — check for some status labels as visible text in checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    // 9 status checkboxes + 1 "Interviews this week" = 10 total
    expect(checkboxes.length).toBeGreaterThanOrEqual(9);
  });

  it('clicking a status checkbox in the popover fires onChange with that status toggled on', () => {
    const onChange = vi.fn();
    render(<FilterBar filters={baseFilters()} onChange={onChange} />);
    // Open the popover
    fireEvent.click(screen.getByRole('button', { name: /status/i }));
    // ALL_STATUSES order in popover: draft(0), applied(1), phone_screen(2)...
    // The "Interviews this week" checkbox is outside the popover (after it in DOM).
    // checkboxes[0]=draft, checkboxes[1]=applied, ...checkboxes[8]=ghosted,
    // checkboxes[9]=interviewsThisWeek
    const allCheckboxes = screen.getAllByRole('checkbox');
    // Click the "applied" checkbox (index 1 in ALL_STATUSES order)
    fireEvent.click(allCheckboxes[1]); // applied = ALL_STATUSES[1]
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ['applied'] }),
    );
  });

  it('clicking a checked status checkbox removes it from the filter', () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={baseFilters({ statuses: ['applied'] })}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /status/i }));
    // When 'applied' is already checked, clicking it fires toggleStatus → removes it
    const allCheckboxes = screen.getAllByRole('checkbox');
    fireEvent.click(allCheckboxes[1]); // applied = ALL_STATUSES[1]
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: [] }),
    );
  });

  it('shows a badge count when statuses are selected', () => {
    render(
      <FilterBar
        filters={baseFilters({ statuses: ['applied', 'interview'] })}
        onChange={vi.fn()}
      />,
    );
    // Badge shows "2" inside the Status button
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('debounces company search: fires onChange after 200ms, not immediately', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<FilterBar filters={baseFilters()} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/search company/i);
    fireEvent.change(input, { target: { value: 'Ac' } });
    // Not fired yet
    expect(onChange).not.toHaveBeenCalled();
    // Advance past debounce threshold
    act(() => { vi.advanceTimersByTime(250); });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ companyQuery: 'Ac' }));
    vi.useRealTimers();
  });

  it('popover closes when clicking outside', () => {
    render(
      <div>
        <FilterBar filters={baseFilters()} onChange={vi.fn()} />
        <div data-testid="outside">Outside</div>
      </div>,
    );
    // Open popover — now 10 checkboxes visible
    fireEvent.click(screen.getByRole('button', { name: /status/i }));
    const beforeCount = screen.getAllByRole('checkbox').length;
    expect(beforeCount).toBe(10); // 9 status + 1 week

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    // After close, only the "Interviews this week" checkbox remains
    expect(screen.getAllByRole('checkbox').length).toBe(1);
  });
});
