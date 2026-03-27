import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResumeMenu } from './ResumeMenu'

const resetResume = vi.fn()
const setActiveResumeId = vi.fn()
const addResume = vi.fn()
const removeResume = vi.fn()
const duplicateResume = vi.fn()
const renameResume = vi.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

const makeResume = (id: string, name: string) => ({
  id,
  name,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  templateId: 'classic' as const,
  sections: [{ id: 's1', order: 0, visible: true, content: { type: 'experience' as const, data: { items: [{ id: 'i1', company: 'Acme', title: 'Eng', bullets: ['Did a thing'] }] } } }],
})

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    resumes: [makeResume('r1', 'My Resume')],
    activeResumeId: 'r1',
    setActiveResumeId,
    addResume,
    removeResume,
    duplicateResume,
    renameResume,
    resetResume,
  }
})

describe('ResumeMenu — reset content', () => {
  it('shows Reset content option in dropdown', async () => {
    const user = userEvent.setup()
    render(<ResumeMenu />)
    await user.click(screen.getByText('My Resume'))
    expect(screen.getByText('Reset content')).toBeInTheDocument()
  })

  it('shows confirmation prompt when Reset content is clicked', async () => {
    const user = userEvent.setup()
    render(<ResumeMenu />)
    await user.click(screen.getByText('My Resume'))
    await user.click(screen.getByText('Reset content'))
    expect(screen.getByText('Clear all content? Cannot be undone.')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls resetResume with active resume id when confirmed', async () => {
    const user = userEvent.setup()
    render(<ResumeMenu />)
    await user.click(screen.getByText('My Resume'))
    await user.click(screen.getByText('Reset content'))
    await user.click(screen.getByText('Yes'))
    expect(resetResume).toHaveBeenCalledWith('r1')
  })

  it('does not call resetResume when cancelled', async () => {
    const user = userEvent.setup()
    render(<ResumeMenu />)
    await user.click(screen.getByText('My Resume'))
    await user.click(screen.getByText('Reset content'))
    await user.click(screen.getByText('Cancel'))
    expect(resetResume).not.toHaveBeenCalled()
    expect(screen.queryByText('Clear all content?')).not.toBeInTheDocument()
  })

  it('closes menu after confirming reset', async () => {
    const user = userEvent.setup()
    render(<ResumeMenu />)
    await user.click(screen.getByText('My Resume'))
    await user.click(screen.getByText('Reset content'))
    await user.click(screen.getByText('Yes'))
    expect(screen.queryByText('New blank resume')).not.toBeInTheDocument()
  })
})
