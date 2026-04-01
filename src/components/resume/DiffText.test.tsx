import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffText } from './DiffText';

describe('DiffText', () => {
  it('renders plain text when old and new are identical', () => {
    render(<DiffText oldText="hello world" newText="hello world" />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders removed text with line-through styling', () => {
    const { container } = render(<DiffText oldText="old word" newText="" />);
    const removed = container.querySelector('.line-through');
    expect(removed).toBeInTheDocument();
    expect(removed?.textContent).toBe('old word');
    expect(removed?.classList.contains('bg-red-100')).toBe(true);
    expect(removed?.classList.contains('text-red-700')).toBe(true);
  });

  it('renders added text with green styling', () => {
    const { container } = render(<DiffText oldText="" newText="new word" />);
    const added = container.querySelector('.bg-green-100');
    expect(added).toBeInTheDocument();
    expect(added?.textContent).toBe('new word');
    expect(added?.classList.contains('text-green-700')).toBe(true);
  });

  it('renders mixed diff with both styles', () => {
    const { container } = render(<DiffText oldText="built REST API" newText="built GraphQL API" />);
    const removed = container.querySelector('.line-through');
    const added = container.querySelector('.bg-green-100');
    expect(removed).toBeInTheDocument();
    expect(added).toBeInTheDocument();
    expect(removed?.textContent).toBe('REST');
    expect(added?.textContent).toBe('GraphQL');
  });
});
