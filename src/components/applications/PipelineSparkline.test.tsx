import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineSparkline } from './PipelineSparkline';

describe('PipelineSparkline', () => {
  it('renders the Pipeline section heading', () => {
    render(<PipelineSparkline counts={[0, 0, 0, 0, 0, 0]} />);
    expect(screen.getByText(/pipeline/i)).toBeInTheDocument();
  });

  it('renders an SVG with the correct aria-label', () => {
    render(<PipelineSparkline counts={[1, 2, 3, 0, 0, 1]} />);
    expect(screen.getByRole('img', { name: /applications by pipeline stage/i })).toBeInTheDocument();
  });

  it('displays counts joined by middle dots', () => {
    render(<PipelineSparkline counts={[1, 2, 1, 0, 0, 1]} />);
    expect(screen.getByText('1 · 2 · 1 · 0 · 0 · 1')).toBeInTheDocument();
  });

  it('renders a rect element for each count', () => {
    const { container } = render(<PipelineSparkline counts={[3, 1, 0, 2, 0, 1]} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(6);
  });

  it('renders tooltip titles with stage labels and counts', () => {
    const { container } = render(<PipelineSparkline counts={[3, 0, 0, 0, 0, 0]} />);
    // Title elements inside SVG groups
    const titles = Array.from(container.querySelectorAll('title')).map((t) => t.textContent);
    // First bar is "Draft: 3"
    expect(titles[0]).toMatch(/draft/i);
    expect(titles[0]).toContain('3');
  });

  it('uses fill-stone-200 for zero-count bars and fill-blue-600 for non-zero', () => {
    const { container } = render(<PipelineSparkline counts={[5, 0, 0, 0, 0, 0]} />);
    const rects = container.querySelectorAll('rect');
    // First bar has count=5 → fill-blue-600
    expect(rects[0].getAttribute('class')).toContain('fill-blue-600');
    // Second bar has count=0 → fill-stone-200
    expect(rects[1].getAttribute('class')).toContain('fill-stone-200');
  });

  it('handles all-zero counts without dividing by zero', () => {
    // Should render without error and show minimum bar heights
    const { container } = render(<PipelineSparkline counts={[0, 0, 0, 0, 0, 0]} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(6);
    // All should have height >= 2 (minimum clamp in source)
    rects.forEach((rect) => {
      const h = parseFloat(rect.getAttribute('height') ?? '0');
      expect(h).toBeGreaterThanOrEqual(2);
    });
  });
});
