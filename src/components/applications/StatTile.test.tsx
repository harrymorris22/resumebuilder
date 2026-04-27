import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('renders label and numeric value', () => {
    render(<StatTile label="Active" value={7} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders label and string value', () => {
    render(<StatTile label="Offer rate" value="42%" />);
    expect(screen.getByText('Offer rate')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('adds font-mono class when mono=true', () => {
    const { container } = render(<StatTile label="Response rate" value="33%" mono />);
    expect(container.querySelector('.font-mono')).toBeTruthy();
  });

  it('does not add font-mono class when mono is absent', () => {
    const { container } = render(<StatTile label="Active" value={3} />);
    // font-mono should not be present on the value element
    const valueEl = container.querySelector('.text-3xl');
    expect(valueEl?.className).not.toContain('font-mono');
  });
});
