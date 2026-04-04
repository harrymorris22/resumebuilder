import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactInfoForm } from './ContactInfoForm';

let mockState: Record<string, unknown>;
const addPoolEntry = vi.fn();
const updatePoolEntry = vi.fn();
const updateResume = vi.fn();

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}));

vi.mock('../../utils/id', () => ({
  generateId: () => 'new-id',
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    contentPool: [],
    addPoolEntry,
    updatePoolEntry,
    resumes: [
      {
        id: 'r1',
        name: 'Test Resume',
        sections: [
          { id: 's1', order: 0, visible: true, content: { type: 'contact', data: { fullName: '', email: '', phone: '', location: '' } } },
        ],
      },
    ],
    activeResumeId: 'r1',
    generatedResumeId: null,
    updateResume,
  };
});

describe('ContactInfoForm', () => {
  it('renders all 7 fields with correct labels', () => {
    render(<ContactInfoForm />);
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn URL')).toBeInTheDocument();
    expect(screen.getByText('GitHub URL')).toBeInTheDocument();
    expect(screen.getByText('Portfolio / Website')).toBeInTheDocument();
  });

  it('shows the section heading', () => {
    render(<ContactInfoForm />);
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
  });

  it('pre-fills values from existing contact pool entry', () => {
    mockState.contentPool = [
      {
        id: 'c1',
        item: {
          type: 'contact',
          data: { fullName: 'Jane Smith', email: 'jane@example.com', phone: '555-1234', location: 'London', linkedin: 'linkedin.com/in/jane', github: '', website: '' },
        },
        source: 'user',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    render(<ContactInfoForm />);
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('London')).toBeInTheDocument();
    expect(screen.getByDisplayValue('linkedin.com/in/jane')).toBeInTheDocument();
  });

  it('creates a new pool entry when none exists and user types', async () => {
    const user = userEvent.setup();
    render(<ContactInfoForm />);
    const nameInput = screen.getByPlaceholderText('Jane Smith');
    await user.type(nameInput, 'J');
    expect(addPoolEntry).toHaveBeenCalled();
    const entry = addPoolEntry.mock.calls[0][0];
    expect(entry.item.type).toBe('contact');
    expect(entry.item.data.fullName).toBe('J');
  });

  it('updates existing pool entry on change', async () => {
    mockState.contentPool = [
      {
        id: 'c1',
        item: {
          type: 'contact',
          data: { fullName: 'Jane', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
        },
        source: 'user',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const user = userEvent.setup();
    render(<ContactInfoForm />);
    const emailInput = screen.getByPlaceholderText('jane@example.com');
    await user.type(emailInput, 'a');
    expect(updatePoolEntry).toHaveBeenCalled();
    const updated = updatePoolEntry.mock.calls[0][0];
    expect(updated.id).toBe('c1');
    expect(updated.item.data.email).toBe('a');
  });

  it('syncs contact data to the active resume', async () => {
    const user = userEvent.setup();
    render(<ContactInfoForm />);
    const nameInput = screen.getByPlaceholderText('Jane Smith');
    await user.type(nameInput, 'J');
    expect(updateResume).toHaveBeenCalled();
    const resumeArg = updateResume.mock.calls[0][0];
    const contactSection = resumeArg.sections.find((s: { content: { type: string } }) => s.content.type === 'contact');
    expect(contactSection.content.data.fullName).toBe('J');
  });
});
