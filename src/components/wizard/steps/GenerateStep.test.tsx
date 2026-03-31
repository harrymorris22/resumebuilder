import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerateStep } from './GenerateStep'

let mockState: Record<string, unknown>

vi.mock('../../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

const mockGenerate = vi.fn()

vi.mock('../../../hooks/useGenerateResume', () => ({
  useGenerateResume: () => ({
    generate: mockGenerate,
    isGenerating: mockState.isGenerating || false,
    error: mockState.genError || null,
    warning: mockState.genWarning || null,
    sections: mockState.genSections || [],
    abort: vi.fn(),
  }),
}))


const setSettingsOpen = vi.fn()
const setWizardStep = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    apiKey: 'test-key',
    generatedResumeId: null,
    activeJobDescriptionId: 'jd1',
    jobDescriptions: [{ id: 'jd1', title: 'SWE', company: 'Acme', keywords: ['react'] }],
    resumes: [],
    setSettingsOpen,
    setWizardStep,
  }
})

describe('GenerateStep', () => {
  it('shows API key setup when no key configured', () => {
    mockState.apiKey = ''
    render(<GenerateStep />)
    expect(screen.getByText('Set Up API Key')).toBeInTheDocument()
  })

  it('shows Generate CV button with job description context', () => {
    render(<GenerateStep />)
    expect(screen.getByRole('button', { name: 'Generate CV' })).toBeInTheDocument()
    expect(screen.getByText(/SWE/)).toBeInTheDocument()
    expect(screen.getByText(/Acme/)).toBeInTheDocument()
  })

  it('calls generate when button clicked', async () => {
    const user = userEvent.setup()
    render(<GenerateStep />)
    await user.click(screen.getByRole('button', { name: 'Generate CV' }))
    expect(mockGenerate).toHaveBeenCalledOnce()
  })

  it('shows progress checklist during generation', () => {
    mockState.isGenerating = true
    mockState.genSections = [
      { name: 'Contact Info', status: 'done' },
      { name: 'Summary', status: 'in-progress' },
      { name: 'Experience', status: 'pending' },
    ]
    render(<GenerateStep />)
    expect(screen.getByText('Building your resume...')).toBeInTheDocument()
    expect(screen.getByText('Contact Info')).toBeInTheDocument()
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('shows split view with resume preview after generation', () => {
    mockState.generatedResumeId = 'r1'
    mockState.resumes = [{ id: 'r1', name: 'Test Resume' }]
    mockState.genSections = [
      { name: 'Contact Info', status: 'done' },
      { name: 'Summary', status: 'done' },
    ]
    render(<GenerateStep />)
    expect(screen.getByText('Your CV is ready')).toBeInTheDocument()
    expect(screen.getByText('Continue to Refine')).toBeInTheDocument()
  })

  it('shows warning when resume has empty sections', () => {
    mockState.generatedResumeId = 'r1'
    mockState.resumes = [{ id: 'r1', name: 'Test' }]
    mockState.genWarning = 'AI completed most sections but these need attention: skills'
    mockState.genSections = [{ name: 'Skills', status: 'pending' }]
    render(<GenerateStep />)
    expect(screen.getByText(/skills/)).toBeInTheDocument()
  })

  it('shows go-back message when no JD selected', () => {
    mockState.activeJobDescriptionId = null
    mockState.jobDescriptions = []
    render(<GenerateStep />)
    expect(screen.getByText(/Go back and select a job description/)).toBeInTheDocument()
  })
})
