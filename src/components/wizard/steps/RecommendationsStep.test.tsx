import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationsStep } from './RecommendationsStep'

let mockState: Record<string, unknown>

vi.mock('../../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

const mockGeneratePoolRecommendations = vi.fn()
const mockExecuteRecommendation = vi.fn()

vi.mock('../../../hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    recommendations: mockState.recommendations,
    isLoading: mockState.recommendationsLoading,
    error: mockState.recommendationsError,
    generatePoolRecommendations: mockGeneratePoolRecommendations,
    generateRefineRecommendations: vi.fn(),
    executeRecommendation: mockExecuteRecommendation,
    abort: vi.fn(),
  }),
}))

const setSettingsOpen = vi.fn()
const clearRecommendations = vi.fn()
const updateRecommendation = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    apiKey: 'test-key',
    contentPool: [{ id: '1' }, { id: '2' }],
    recommendations: [],
    recommendationsLoading: false,
    recommendationsError: null,
    setSettingsOpen,
    clearRecommendations,
    updateRecommendation,
  }
})

describe('RecommendationsStep', () => {
  it('shows API key setup when no key configured', () => {
    mockState.apiKey = ''
    render(<RecommendationsStep />)
    expect(screen.getByText('Set Up API Key')).toBeInTheDocument()
  })

  it('shows Generate Recommendations button when API key is set', () => {
    render(<RecommendationsStep />)
    expect(screen.getByText('Generate Recommendations')).toBeInTheDocument()
  })

  it('shows pool item count in subtitle', () => {
    render(<RecommendationsStep />)
    expect(screen.getByText(/Analyze your 2 pool items/)).toBeInTheDocument()
  })

  it('calls generatePoolRecommendations when button clicked', async () => {
    const user = userEvent.setup()
    render(<RecommendationsStep />)
    await user.click(screen.getByText('Generate Recommendations'))
    expect(mockGeneratePoolRecommendations).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    mockState.recommendationsLoading = true
    render(<RecommendationsStep />)
    expect(screen.getByText('Analyzing...')).toBeInTheDocument()
  })

  it('shows error banner with retry', () => {
    mockState.recommendationsError = 'API error: timeout'
    render(<RecommendationsStep />)
    expect(screen.getByText('API error: timeout')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('renders recommendation cards when present', () => {
    mockState.recommendations = [
      { id: 'r1', text: 'Add metrics to your Numan bullet', category: 'metrics', priority: 'high', status: 'pending', prompt: 'test' },
      { id: 'r2', text: 'Rewrite summary', category: 'content', priority: 'medium', status: 'pending', prompt: 'test' },
    ]
    render(<RecommendationsStep />)
    expect(screen.getByText('Add metrics to your Numan bullet')).toBeInTheDocument()
    expect(screen.getByText('Rewrite summary')).toBeInTheDocument()
  })

  it('shows Regenerate button when recommendations exist', () => {
    mockState.recommendations = [
      { id: 'r1', text: 'Test', category: 'content', priority: 'medium', status: 'pending', prompt: 'test' },
    ]
    render(<RecommendationsStep />)
    expect(screen.getByText('Regenerate')).toBeInTheDocument()
  })
})
