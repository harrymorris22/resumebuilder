import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoverLetterPanel } from './CoverLetterPanel'

let mockState: Record<string, unknown>

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

const mockGenerate = vi.fn()
const mockAbort = vi.fn()

vi.mock('../../hooks/useGenerateCoverLetter', () => ({
  useGenerateCoverLetter: () => ({
    generate: mockGenerate,
    isGenerating: mockState.hookIsGenerating || false,
    error: mockState.hookError || null,
    abort: mockAbort,
  }),
}))

vi.mock('../export/WordExporter', () => ({
  exportCoverLetterToWord: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    activeCoverLetter: null,
    updateCoverLetter: vi.fn(),
    generatedResumeId: 'r1',
    activeJobDescriptionId: 'jd1',
    jobDescriptions: [{ id: 'jd1', title: 'SWE', company: 'Acme', rawText: '', keywords: [], createdAt: '' }],
    resumes: [{ id: 'r1', name: 'Test Resume', sections: [], createdAt: '', updatedAt: '', templateId: 'classic' }],
    hookIsGenerating: false,
    hookError: null,
  }
})

describe('CoverLetterPanel', () => {
  it('shows "generate a resume first" message when no prerequisites', () => {
    mockState.generatedResumeId = null
    mockState.activeJobDescriptionId = null
    render(<CoverLetterPanel />)
    expect(
      screen.getByText(/Generate a resume and select a job description first/)
    ).toBeInTheDocument()
  })

  it('shows generate button and tone selector when prerequisites met but no cover letter', () => {
    render(<CoverLetterPanel />)
    expect(screen.getByRole('button', { name: /Generate Cover Letter/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    // Tone options present
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Conversational')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
  })

  it('shows loading state when generating', () => {
    mockState.hookIsGenerating = true
    render(<CoverLetterPanel />)
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('shows cover letter text and toolbar when cover letter exists', () => {
    mockState.activeCoverLetter = {
      id: 'cl1',
      resumeId: 'r1',
      jobDescriptionId: 'jd1',
      text: 'Dear Hiring Manager, I am writing to express my interest...',
      tone: 'professional',
      createdAt: '2024-01-01',
    }
    render(<CoverLetterPanel />)
    expect(
      screen.getByText('Dear Hiring Manager, I am writing to express my interest...')
    ).toBeInTheDocument()
    // Toolbar buttons
    expect(screen.getByText('Copy')).toBeInTheDocument()
    expect(screen.getByText('Export Word')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Regenerate')).toBeInTheDocument()
  })

  it('shows error message when error occurs', () => {
    mockState.hookError = 'Invalid API key. Check Settings.'
    render(<CoverLetterPanel />)
    expect(screen.getByText('Invalid API key. Check Settings.')).toBeInTheDocument()
  })
})
