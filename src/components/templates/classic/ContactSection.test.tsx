import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactSection } from './ContactSection';
import type { ContactInfo } from '../../../types/resume';

describe('ContactSection', () => {
  const base: ContactInfo = { fullName: 'Harry Morris', email: 'harry@test.com', phone: '555-1234', location: 'London' };

  it('renders full name as heading', () => {
    render(<ContactSection data={base} />);
    expect(screen.getByText('Harry Morris')).toBeInTheDocument();
  });

  it('renders email, phone, and location on one line', () => {
    render(<ContactSection data={base} />);
    expect(screen.getByText('harry@test.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('renders LinkedIn as labeled link, not raw URL', () => {
    const data = { ...base, linkedin: 'https://linkedin.com/in/harry' };
    render(<ContactSection data={data} />);
    const link = screen.getByRole('link', { name: 'LinkedIn' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/harry');
    // Raw URL should NOT appear as text
    expect(screen.queryByText('https://linkedin.com/in/harry')).not.toBeInTheDocument();
  });

  it('renders GitHub as labeled link', () => {
    const data = { ...base, github: 'https://github.com/harry' };
    render(<ContactSection data={data} />);
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/harry');
  });

  it('renders website as Portfolio link', () => {
    const data = { ...base, website: 'https://harry.dev' };
    render(<ContactSection data={data} />);
    const link = screen.getByRole('link', { name: 'Portfolio' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://harry.dev');
  });

  it('renders all links on same line as contact details', () => {
    const data = {
      ...base,
      linkedin: 'https://linkedin.com/in/harry',
      github: 'https://github.com/harry',
      website: 'https://harry.dev',
    };
    render(<ContactSection data={data} />);
    // All items should be inside a single flex container
    const container = screen.getByText('harry@test.com').closest('div');
    expect(container).not.toBeNull();
    // Links should be siblings in the same container
    const linkedInLink = screen.getByRole('link', { name: 'LinkedIn' });
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
    expect(container!.contains(linkedInLink)).toBe(true);
    expect(container!.contains(githubLink)).toBe(true);
    expect(container!.contains(portfolioLink)).toBe(true);
  });

  it('does not show links section when no URLs set', () => {
    render(<ContactSection data={base} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
