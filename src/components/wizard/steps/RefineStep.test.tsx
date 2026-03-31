import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RefineStep } from './RefineStep'

let mockState: Record<string, unknown>

vi.mock('../../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

const mockGenerateRefine = vi.fn()
const mockExecuteRec = vi.fn()

vi.mock('../../../hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    recommendations: mockState.recommendations || [],
    isLoading: mockState.recsLoading || false,
    error: mockState.recsError || null,
    generateRefineRecommendations: mockGenerateRefine,
    executeRecommendation: mockExecuteRec,
    generatePoolRecommendations: vi.fn(),
    generateJdRecommendations: vi.fn(),
    abort: vi.fn(),
  }),
}))

vi.mock('../../resume/ResumePreview', () => ({
  ResumePreview: () => <div data-testid="resume-preview">ResumePreview</div>,
}))

vi.mock('../../export/ExportMenu', () => ({
  ExportMenu: () => <div data-testid="export-menu">ExportMenu</div>,
}))

const setSettingsOpen = vi.fn()
const updateRecommendation = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    apiKey: 'test-key',
    generatedResumeId: 'r1',
    activeJobDescriptionId: 'jd1',
    jobDescriptions: [{ id: 'jd1', title: 'SWE', company: 'Acme', keywords: ['react'] }],
    resumes: [{ id: 'r1', name: 'Test Resume', sections: [] }],
    recommendations: [],
    setSettingsOpen,
    updateRecommendation,
  }
})

describe('RefineStep', () => {
  it('shows API key setup when no key configured', () => {
    mockState.apiKey = ''
    render(<RefineStep />)
    expect(screen.getByText('Set Up API Key')).toBeInTheDocument()
  })

  it('shows go-back message when no generated resume', () => {
    mockState.generatedResumeId = null
    mockState.resumes = []
    render(<RefineStep />)
    expect(screen.getByText(/Go back to Step 4/)).toBeInTheDocument()
  })

  it('shows split view with resume preview and suggestions', () => {
    render(<RefineStep />)
    expect(screen.getByText('Refine Your CV')).toBeInTheDocument()
    expect(screen.getByTestId('resume-preview')).toBeInTheDocument()
    expect(screen.getByTestId('export-menu')).toBeInTheDocument()
    expect(screen.getByText('Get Refinement Suggestions')).toBeInTheDocument()
  })

  it('shows job context in subtitle', () => {
    render(<RefineStep />)
    expect(screen.getByText(/SWE at Acme/)).toBeInTheDocument()
  })

  it('calls generateRefineRecommendations when button clicked', async () => {
    const user = userEvent.setup()
    render(<RefineStep />)
    await user.click(screen.getByText('Get Refinement Suggestions'))
    expect(mockGenerateRefine).toHaveBeenCalledOnce()
  })

  it('renders recommendation cards when present', () => {
    mockState.recommendations = [
      { id: 'r1', text: 'Add React keyword to bullet 3', category: 'keyword', priority: 'high', status: 'pending', prompt: 'test', relatedKeywords: ['react'] },
    ]
    render(<RefineStep />)
    expect(screen.getByText('Add React keyword to bullet 3')).toBeInTheDocument()
  })
})
