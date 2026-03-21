import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadResumeModal } from './UploadResumeModal'

// Mock the store
vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      apiKey: 'test-key',
      addResume: vi.fn(),
      setActiveResumeId: vi.fn(),
    }
    return selector(state)
  }),
}))

// Mock the resume parser
vi.mock('../../services/resumeParser', () => ({
  extractText: vi.fn(),
  parseResumeWithClaude: vi.fn(),
}))

describe('UploadResumeModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <UploadResumeModal open={false} onClose={onClose} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders modal when open', () => {
    render(<UploadResumeModal open={true} onClose={onClose} />)
    expect(screen.getByText('Upload Resume')).toBeInTheDocument()
    expect(
      screen.getByText(/Upload a PDF, Word document, or text file/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Drop your resume here or click to browse')
    ).toBeInTheDocument()
  })

  it('closes when clicking the close button', async () => {
    const user = userEvent.setup()
    render(<UploadResumeModal open={true} onClose={onClose} />)
    const closeBtn = screen.getByLabelText('Close')
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when clicking the overlay', async () => {
    const user = userEvent.setup()
    render(<UploadResumeModal open={true} onClose={onClose} />)
    const overlay = screen.getByRole('dialog')
    await user.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error when no API key is set', async () => {
    const { useAppStore } = await import('../../stores/useAppStore')
    vi.mocked(useAppStore).mockImplementation((selector) => {
      const state = {
        apiKey: '',
        addResume: vi.fn(),
        setActiveResumeId: vi.fn(),
      }
      return selector(state)
    })

    const user = userEvent.setup()
    render(<UploadResumeModal open={true} onClose={onClose} />)

    const file = new File(['resume content'], 'resume.txt', {
      type: 'text/plain',
    })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(
      await screen.findByText(/Please set your Anthropic API key/)
    ).toBeInTheDocument()
  })
})
