import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobDescriptionStep } from './JobDescriptionStep'

let mockState: Record<string, unknown>

vi.mock('../../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

const mockAnalyze = vi.fn()

vi.mock('../../../hooks/useAnalyzeJobDescription', () => ({
  useAnalyzeJobDescription: () => ({
    analyze: mockAnalyze,
    isLoading: mockState.jdLoading,
    error: mockState.jdError,
  }),
}))

const setSettingsOpen = vi.fn()
const setActiveJobDescriptionId = vi.fn()
const removeJobDescription = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    apiKey: 'test-key',
    jobDescriptions: [],
    activeJobDescriptionId: null,
    jdLoading: false,
    jdError: null,
    setSettingsOpen,
    setActiveJobDescriptionId,
    removeJobDescription,
  }
})

describe('JobDescriptionStep', () => {
  it('shows API key setup when no key configured', () => {
    mockState.apiKey = ''
    render(<JobDescriptionStep />)
    expect(screen.getByText('Set Up API Key')).toBeInTheDocument()
  })

  it('shows JD form with textarea', () => {
    render(<JobDescriptionStep />)
    expect(screen.getByPlaceholderText('Paste the full job description here...')).toBeInTheDocument()
    expect(screen.getByText('Save & Analyze')).toBeInTheDocument()
  })

  it('Save & Analyze button is disabled when textarea is empty', () => {
    render(<JobDescriptionStep />)
    const btn = screen.getByText('Save & Analyze')
    expect(btn).toBeDisabled()
  })

  it('calls analyze when form submitted with text', async () => {
    const user = userEvent.setup()
    render(<JobDescriptionStep />)
    const textarea = screen.getByPlaceholderText('Paste the full job description here...')
    await user.type(textarea, 'Senior Engineer at Acme Corp...')
    await user.click(screen.getByText('Save & Analyze'))
    expect(mockAnalyze).toHaveBeenCalledWith('Senior Engineer at Acme Corp...')
  })

  it('shows saved JDs when they exist', () => {
    mockState.jobDescriptions = [
      { id: 'jd1', title: 'Senior SWE', company: 'Google', keywords: ['react', 'typescript'], createdAt: '2026-03-31' },
    ]
    render(<JobDescriptionStep />)
    expect(screen.getByText('Senior SWE')).toBeInTheDocument()
    expect(screen.getByText(/Google/)).toBeInTheDocument()
  })

  it('shows selected JD details with keywords', () => {
    mockState.jobDescriptions = [
      { id: 'jd1', title: 'Senior SWE', company: 'Google', keywords: ['react', 'typescript', 'node'], createdAt: '2026-03-31', rawText: 'test' },
    ]
    mockState.activeJobDescriptionId = 'jd1'
    render(<JobDescriptionStep />)
    expect(screen.getByText('SELECTED')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
    expect(screen.getByText('node')).toBeInTheDocument()
  })

  it('shows empty state when no JDs exist', () => {
    render(<JobDescriptionStep />)
    expect(screen.getByText(/No saved job descriptions yet/)).toBeInTheDocument()
  })

  it('shows error banner', () => {
    mockState.jdError = 'Analysis failed'
    render(<JobDescriptionStep />)
    expect(screen.getByText('Analysis failed')).toBeInTheDocument()
  })
})
