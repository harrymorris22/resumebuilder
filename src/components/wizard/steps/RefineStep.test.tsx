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

const mockAnalyze = vi.fn()

vi.mock('../../../hooks/useAnalyzeJobDescription', () => ({
  useAnalyzeJobDescription: () => ({
    analyze: mockAnalyze,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../../resume/ResumePreview', () => ({
  ResumePreview: () => <div data-testid="resume-preview">ResumePreview</div>,
}))

vi.mock('../../resume/DiffResumePreview', () => ({
  DiffResumePreview: () => <div data-testid="diff-preview">DiffResumePreview</div>,
}))

vi.mock('../../resume/TemplateSelector', () => ({
  TemplateSelector: () => <div data-testid="template-selector">TemplateSelector</div>,
}))

vi.mock('../../contentPool/ContentPoolPage', () => ({
  ContentPoolPage: ({ showCheckboxes }: { showCheckboxes?: boolean }) => (
    <div data-testid="content-pool" data-checkboxes={showCheckboxes}>ContentPool</div>
  ),
}))

vi.mock('../../jobDescription/JobDescriptionForm', () => ({
  JobDescriptionForm: () => <div data-testid="jd-form">JobDescriptionForm</div>,
}))

vi.mock('../../jobDescription/SavedJobList', () => ({
  SavedJobList: () => <div data-testid="saved-job-list">SavedJobList</div>,
}))

const setSettingsOpen = vi.fn()
const updateRecommendation = vi.fn()
const setActiveJobDescriptionId = vi.fn()
const removeJobDescription = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    apiKey: 'test-key',
    generatedResumeId: 'r1',
    activeJobDescriptionId: 'jd1',
    jobDescriptions: [{ id: 'jd1', title: 'SWE', company: 'Acme', rawText: 'We are looking for a React developer...', keywords: ['react'] }],
    resumes: [{ id: 'r1', name: 'Test Resume', sections: [] }],
    recommendations: [],
    diffSnapshot: null,
    setSettingsOpen,
    updateRecommendation,
    setActiveJobDescriptionId,
    removeJobDescription,
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

  it('shows combined layout with tabs, template selector, and resume preview', () => {
    render(<RefineStep />)
    expect(screen.getByTestId('resume-preview')).toBeInTheDocument()
    expect(screen.getByTestId('template-selector')).toBeInTheDocument()
    expect(screen.getByText('Get AI Suggestions')).toBeInTheDocument()
    // Tab bar present
    expect(screen.getByRole('tablist', { name: 'Left panel tabs' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Suggestions' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Content Pool' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Job Description' })).toBeInTheDocument()
  })

  it('defaults to Suggestions tab', () => {
    render(<RefineStep />)
    expect(screen.getByRole('tab', { name: 'Suggestions' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Get AI Suggestions')).toBeInTheDocument()
  })

  it('switches to Content Pool tab', async () => {
    const user = userEvent.setup()
    render(<RefineStep />)
    await user.click(screen.getByRole('tab', { name: 'Content Pool' }))
    expect(screen.getByTestId('content-pool')).toBeInTheDocument()
    expect(screen.getByTestId('content-pool')).toHaveAttribute('data-checkboxes', 'true')
    expect(screen.queryByText('Get AI Suggestions')).not.toBeInTheDocument()
  })

  it('switches to Job Description tab and shows active JD text + keywords', async () => {
    const user = userEvent.setup()
    render(<RefineStep />)
    await user.click(screen.getByRole('tab', { name: 'Job Description' }))
    // Active JD full text shown
    expect(screen.getByText('We are looking for a React developer...')).toBeInTheDocument()
    // Keywords shown
    expect(screen.getByText('react')).toBeInTheDocument()
    // JD form shown at bottom
    expect(screen.getByTestId('jd-form')).toBeInTheDocument()
    // Saved list hidden when only 1 JD
    expect(screen.queryByTestId('saved-job-list')).not.toBeInTheDocument()
    expect(screen.queryByText('Get AI Suggestions')).not.toBeInTheDocument()
  })

  it('shows saved job list when multiple JDs exist', async () => {
    mockState.jobDescriptions = [
      { id: 'jd1', title: 'SWE', company: 'Acme', rawText: 'React dev...', keywords: ['react'] },
      { id: 'jd2', title: 'FE', company: 'BigCo', rawText: 'Frontend...', keywords: ['vue'] },
    ]
    const user = userEvent.setup()
    render(<RefineStep />)
    await user.click(screen.getByRole('tab', { name: 'Job Description' }))
    expect(screen.getByTestId('saved-job-list')).toBeInTheDocument()
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
