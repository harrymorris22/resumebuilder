import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FloatingChat } from './FloatingChat'

let mockState: Record<string, unknown>

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

vi.mock('../actions/ActionPanel', () => ({
  ActionPanel: () => <div data-testid="action-panel">ActionPanel</div>,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    pendingAutoMessage: null,
  }
})

describe('FloatingChat', () => {
  it('renders the floating button when closed', () => {
    render(<FloatingChat />)
    expect(screen.getByLabelText('Open AI Coach')).toBeInTheDocument()
  })

  it('opens the drawer when the floating button is clicked', async () => {
    const user = userEvent.setup()
    render(<FloatingChat />)

    await user.click(screen.getByLabelText('Open AI Coach'))
    expect(screen.getByTestId('action-panel')).toBeInTheDocument()
  })

  it('auto-opens the drawer when pendingAutoMessage is set', () => {
    mockState.pendingAutoMessage = 'Analyze my CV'
    render(<FloatingChat />)

    expect(screen.getByTestId('action-panel')).toBeInTheDocument()
    expect(screen.queryByLabelText('Open AI Coach')).not.toBeInTheDocument()
  })

  it('stays closed when pendingAutoMessage is null', () => {
    mockState.pendingAutoMessage = null
    render(<FloatingChat />)

    expect(screen.queryByTestId('action-panel')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Open AI Coach')).toBeInTheDocument()
  })
})
