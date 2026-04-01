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

vi.mock('../../resume/DiffResumePreview', () => ({
  DiffResumePreview: () => <div data-testid="diff-preview">DiffResumePreview</div>,
}))

vi.mock('../../export/ExportMenu', () => ({
  ExportMenu: () => <div data-testid="export-menu">ExportMenu</div>,
}))

vi.mock('../../resume/TemplateSelector', () => ({
  TemplateSelector: () => <div data-testid="template-selector">TemplateSelector</div>,
}))

vi.mock('../../contentPool/ContentPoolPage', () => ({
  ContentPoolPage: ({ showCheckboxes }: { showCheckboxes?: boolean }) => (
    <div data-testid="content-pool" data-checkboxes={showCheckboxes}>ContentPool</div>
  ),
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
    diffSnapshot: null,
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
    expect(screen.getByText(/Go back to Step 3/)).toBeInTheDocument()
  })

  it('shows combined layout with resume preview, recommendations, and content pool', () => {
    render(<RefineStep />)
    expect(screen.getByText('Refine Your CV')).toBeInTheDocument()
    expect(screen.getByTestId('resume-preview')).toBeInTheDocument()
    expect(screen.getByTestId('export-menu')).toBeInTheDocument()
    expect(screen.getByTestId('template-selector')).toBeInTheDocument()
    expect(screen.getByTestId('content-pool')).toBeInTheDocument()
    expect(screen.getByText('Get AI Suggestions')).toBeInTheDocument()
  })

  it('passes showCheckboxes=true to ContentPoolPage', () => {
    render(<RefineStep />)
    const pool = screen.getByTestId('content-pool')
    expect(pool).toHaveAttribute('data-checkboxes', 'true')
  })

  it('shows job context in subtitle', () => {
    render(<RefineStep />)
    expect(screen.getByText(/SWE at Acme/)).toBeInTheDocument()
  })

  it('calls generateRefineRecommendations when button clicked', async () => {
    const user = userEvent.setup()
    render(<RefineStep />)
    await user.click(screen.getByText('Get AI Suggestions'))
    expect(mockGenerateRefine).toHaveBeenCalledOnce()
  })

  it('renders recommendation cards when present', () => {
    mockState.recommendations = [
      { id: 'r1', text: 'Add React keyword to bullet 3', category: 'keyword', priority: 'high', status: 'pending', prompt: 'test', relatedKeywords: ['react'] },
    ]
    render(<RefineStep />)
    expect(screen.getByText('Add React keyword to bullet 3')).toBeInTheDocument()
  })

  it('does not show Show Changes button when no diff snapshot', () => {
    render(<RefineStep />)
    expect(screen.queryByText('Show Changes')).not.toBeInTheDocument()
  })

  it('shows Show Changes button when diff snapshot exists', () => {
    mockState.diffSnapshot = [{ id: 's1', order: 0, visible: true, content: { type: 'summary', data: { text: 'old' } } }]
    render(<RefineStep />)
    expect(screen.getByText('Show Changes')).toBeInTheDocument()
  })

  it('toggles between resume preview and diff preview', async () => {
    const user = userEvent.setup()
    mockState.diffSnapshot = [{ id: 's1', order: 0, visible: true, content: { type: 'summary', data: { text: 'old' } } }]
    render(<RefineStep />)

    // Initially shows resume preview
    expect(screen.getByTestId('resume-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('diff-preview')).not.toBeInTheDocument()

    // Click Show Changes
    await user.click(screen.getByText('Show Changes'))
    expect(screen.getByTestId('diff-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('resume-preview')).not.toBeInTheDocument()

    // Click Hide Changes
    await user.click(screen.getByText('Hide Changes'))
    expect(screen.getByTestId('resume-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('diff-preview')).not.toBeInTheDocument()
  })
})
